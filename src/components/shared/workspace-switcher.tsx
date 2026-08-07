"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Search,
  Plus,
  Wifi,
  WifiOff,
  Users,
  Check,
  Sparkles,
  Building2,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DEMO_WORKSPACES,
  CURRENT_WORKSPACE_ID,
  INDUSTRY_OPTIONS,
  formatMemberCount,
  getPlanBadgeClasses,
  type Workspace,
  type WorkspacePlan,
  type Industry,
} from "@/lib/workspace-data";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

// ── Local storage key for recent workspaces ──────────────────────
const RECENT_KEY = "rescueloop-recent-workspaces";
const MAX_RECENT = 3;

function getRecentIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
}

function addRecentId(id: string) {
  if (typeof window === "undefined") return;
  try {
    const prev = getRecentIds().filter((r) => r !== id);
    localStorage.setItem(RECENT_KEY, JSON.stringify([id, ...prev].slice(0, MAX_RECENT)));
  } catch {
    /* ignore */
  }
}

// ── Plan badge component ────────────────────────────────────────
function PlanBadge({ plan }: { plan: WorkspacePlan }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[3px] border px-1.5 py-px text-[9px] font-semibold uppercase tracking-[0.04em]",
        getPlanBadgeClasses(plan),
      )}
    >
      {plan}
    </span>
  );
}

// ── Workspace list item ─────────────────────────────────────────
function WorkspaceItem({
  workspace,
  isCurrent,
  isSelected,
  onSelect,
}: {
  workspace: Workspace;
  isCurrent: boolean;
  isSelected: boolean;
  onSelect: (ws: Workspace) => void;
}) {
  const isMuted = !workspace.connected;

  return (
    <button
      type="button"
      onClick={() => onSelect(workspace)}
      className={cn(
        "flex w-full items-center gap-3 rounded-[6px] px-2.5 py-2 text-left transition-colors",
        isSelected
          ? "bg-[var(--recovery-light)] text-[var(--ink-primary)]"
          : "text-[var(--ink-secondary)] hover:bg-[var(--canvas-elevated)] hover:text-[var(--ink-primary)]",
        isMuted && "opacity-60",
      )}
    >
      {/* Avatar with status dot */}
      <div className="relative shrink-0">
        <Avatar className="size-8 rounded-[6px]">
          <AvatarFallback className="rounded-[6px] bg-[var(--canvas-elevated)] text-[10px] font-semibold text-[var(--ink-secondary)]">
            {workspace.initials}
          </AvatarFallback>
        </Avatar>
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 flex size-2.5 items-center justify-center rounded-full border border-[var(--surface)]",
            workspace.connected
              ? "bg-[var(--recovery-green)]"
              : "bg-[var(--ink-muted)]",
          )}
        />
      </div>

      {/* Name + meta */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[13px] font-medium">{workspace.name}</span>
          {isCurrent && (
            <span className="flex size-3.5 shrink-0 items-center justify-center rounded-full bg-[var(--recovery-green)]">
              <Check className="size-2 text-white" strokeWidth={3} />
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-[var(--ink-muted)]">
          <Users className="size-2.5" />
          <span>{formatMemberCount(workspace.memberCount)}</span>
          <span>·</span>
          {workspace.connected ? (
            <Wifi className="size-2.5 text-[var(--recovery-green)]" />
          ) : (
            <WifiOff className="size-2.5" />
          )}
          <PlanBadge plan={workspace.plan} />
        </div>
      </div>
    </button>
  );
}

// ── Create Workspace Dialog ─────────────────────────────────────
function CreateWorkspaceDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState<Industry | "">("");
  const [plan, setPlan] = useState<WorkspacePlan>("Starter");
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  const canProceedStep1 = name.trim().length >= 2 && industry !== "";

  const resetForm = useCallback(() => {
    setStep(1);
    setName("");
    setIndustry("");
    setPlan("Starter");
    setCreating(false);
  }, []);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) resetForm();
      onOpenChange(nextOpen);
    },
    [onOpenChange, resetForm],
  );

  const handleCreate = useCallback(async () => {
    setCreating(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1500));
    const newId = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setCreating(false);
    onOpenChange(false);
    toast.success("Workspace created!", {
      description: `"${name}" is ready. Welcome aboard!`,
    });
    router.push(`/dashboard/${newId}`);
  }, [name, onOpenChange, router]);

  const planCards: { value: WorkspacePlan; label: string; price: string; desc: string; features: string[] }[] = [
    {
      value: "Starter",
      label: "Starter",
      price: "$29/mo",
      desc: "For solo creators",
      features: ["Up to 100 members", "5 playbooks", "Email support"],
    },
    {
      value: "Growth",
      label: "Growth",
      price: "$79/mo",
      desc: "For growing teams",
      features: ["Up to 1,000 members", "Unlimited playbooks", "Priority support", "Analytics"],
    },
    {
      value: "Enterprise",
      label: "Enterprise",
      price: "Custom",
      desc: "For large orgs",
      features: ["Unlimited members", "Custom integrations", "Dedicated CSM", "SLA guarantee"],
    },
  ];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[480px] gap-0 p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="border-b border-[var(--hairline)] px-5 py-4">
          <DialogTitle className="flex items-center gap-2 font-serif text-[18px]">
            <Sparkles className="size-4 text-[var(--recovery-green)]" />
            Create workspace
          </DialogTitle>
          <DialogDescription className="text-[12px] text-[var(--ink-muted)]">
            {step === 1
              ? "Step 1 of 2 — Name & industry"
              : "Step 2 of 2 — Choose your plan"}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-1 px-5 pt-3">
          <div
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              step >= 1 ? "bg-[var(--recovery-green)]" : "bg-[var(--hairline)]",
            )}
          />
          <div
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              step >= 2 ? "bg-[var(--recovery-green)]" : "bg-[var(--hairline)]",
            )}
          />
        </div>

        <div className="px-5 py-4">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Workspace name */}
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-[var(--ink-secondary)]">
                    Workspace name
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. My Creator Community"
                    className="h-10 rounded-[8px] border-[var(--hairline)] bg-[var(--canvas)] text-[14px] placeholder:text-[var(--ink-muted)]"
                    autoFocus
                  />
                </div>

                {/* Industry selector */}
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-[var(--ink-secondary)]">
                    Industry
                  </label>
                  <Select value={industry} onValueChange={(v) => setIndustry(v as Industry)}>
                    <SelectTrigger className="h-10 w-full rounded-[8px] border-[var(--hairline)] bg-[var(--canvas)]">
                      <SelectValue placeholder="Select industry…" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRY_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={() => setStep(2)}
                  disabled={!canProceedStep1}
                  className="w-full rounded-[8px] bg-[var(--recovery-green)] text-white hover:bg-[var(--recovery-green)]/90"
                >
                  Continue
                  <ArrowRight className="ml-1.5 size-4" />
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                {planCards.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPlan(p.value)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-[8px] border p-3 text-left transition-all",
                      plan === p.value
                        ? "border-[var(--recovery-green)] bg-[var(--recovery-light)] shadow-[0_0_0_1px_var(--recovery-green)]"
                        : "border-[var(--hairline)] bg-[var(--canvas)] hover:border-[var(--hairline-strong)]",
                    )}
                  >
                    <div
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                        plan === p.value
                          ? "border-[var(--recovery-green)] bg-[var(--recovery-green)]"
                          : "border-[var(--hairline-strong)]",
                      )}
                    >
                      {plan === p.value && <Check className="size-3 text-white" strokeWidth={3} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-semibold text-[var(--ink-primary)]">{p.label}</span>
                        <span className="text-[13px] font-semibold text-[var(--ink-secondary)]">{p.price}</span>
                      </div>
                      <p className="text-[11px] text-[var(--ink-muted)]">{p.desc}</p>
                      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
                        {p.features.map((f) => (
                          <span key={f} className="flex items-center gap-1 text-[10px] text-[var(--ink-muted)]">
                            <Check className="size-2.5 text-[var(--recovery-green)]" />
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                ))}

                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1 rounded-[8px] border-[var(--hairline)]"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={creating}
                    className="flex-1 rounded-[8px] bg-[var(--recovery-green)] text-white hover:bg-[var(--recovery-green)]/90"
                  >
                    {creating ? (
                      <span className="flex items-center gap-2">
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                          className="inline-block size-4 rounded-full border-2 border-white/30 border-t-white"
                        />
                        Creating…
                      </span>
                    ) : (
                      <>
                        <Building2 className="mr-1.5 size-4" />
                        Create workspace
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main WorkspaceSwitcher ──────────────────────────────────────
export function WorkspaceSwitcher({
  currentId = CURRENT_WORKSPACE_ID,
  variant = "sidebar",
  onSwitch,
}: {
  currentId?: string;
  variant?: "sidebar" | "compact";
  onSwitch?: (workspace: Workspace) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [recentIds, setRecentIds] = useState<string[]>(() => getRecentIds());
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const currentWorkspace = useMemo(
    () => DEMO_WORKSPACES.find((w) => w.id === currentId) ?? DEMO_WORKSPACES[0],
    [currentId],
  );

  const otherWorkspaces = useMemo(
    () => DEMO_WORKSPACES.filter((w) => w.id !== currentId),
    [currentId],
  );

  // Filtered workspaces (excluding current)
  const filtered = useMemo(() => {
    if (!search.trim()) return otherWorkspaces;
    const q = search.toLowerCase();
    return otherWorkspaces.filter((w) => w.name.toLowerCase().includes(q));
  }, [otherWorkspaces, search]);

  // Recent workspaces (filtered, not current)
  const recentWorkspaces = useMemo(() => {
    if (!search.trim()) {
      return recentIds
        .filter((id) => id !== currentId)
        .map((id) => DEMO_WORKSPACES.find((w) => w.id === id))
        .filter((w): w is Workspace => w !== undefined)
        .slice(0, MAX_RECENT);
    }
    return [];
  }, [recentIds, currentId, search]);

  const resetPopover = useCallback(() => {
    setSearch("");
    setFocusedIndex(-1);
  }, []);

  const handlePopoverOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) resetPopover();
      setOpen(nextOpen);
    },
    [resetPopover],
  );

  const handleSelect = useCallback(
    (ws: Workspace) => {
      addRecentId(ws.id);
      setRecentIds(getRecentIds());
      setOpen(false);
      resetPopover();
      if (onSwitch) {
        onSwitch(ws);
      } else {
        router.push(`/dashboard/${ws.id}`);
      }
    },
    [onSwitch, router, resetPopover],
  );

  // All selectable items in the list (for keyboard nav)
  const allItems = useMemo(() => {
    const items: Workspace[] = [];
    recentWorkspaces.forEach((w) => items.push(w));
    filtered.forEach((w) => {
      if (!items.find((i) => i.id === w.id)) items.push(w);
    });
    return items;
  }, [recentWorkspaces, filtered]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex((prev) => Math.min(prev + 1, allItems.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && focusedIndex >= 0 && focusedIndex < allItems.length) {
        e.preventDefault();
        handleSelect(allItems[focusedIndex]);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    },
    [allItems, focusedIndex, handleSelect],
  );

  const isCompact = variant === "compact";

  return (
    <>
      <Popover open={open} onOpenChange={handlePopoverOpenChange}>
        <PopoverTrigger asChild>
          {isCompact ? (
            /* Compact variant — for mobile header */
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-[6px] px-1.5 py-1 text-[13px] font-medium text-[var(--ink-primary)] transition-colors hover:bg-[var(--canvas-elevated)]"
              aria-label="Switch workspace"
            >
              <span className="truncate max-w-[140px]">{currentWorkspace.name}</span>
              <ChevronDown className="size-3 text-[var(--ink-muted)]" />
            </button>
          ) : (
            /* Sidebar variant — full trigger with plan badge */
            <button
              type="button"
              className="min-w-0 flex-1 rounded-[4px] px-1 py-0.5 text-left transition-colors hover:bg-[var(--canvas)]/60"
              aria-label="Switch workspace"
            >
              <div className="flex items-center gap-1.5">
                <span className="truncate font-serif text-[13px] font-medium text-[var(--ink-primary)]">
                  {currentWorkspace.name}
                </span>
                <ChevronDown className="size-3 shrink-0 text-[var(--ink-muted)]" />
              </div>
              <div className="flex items-center gap-1 text-[10px] text-[var(--ink-muted)]">
                {currentWorkspace.connected ? (
                  <Wifi className="size-2.5 text-[var(--recovery-green)]" />
                ) : (
                  <WifiOff className="size-2.5 text-[var(--ink-muted)]" />
                )}
                <span>{currentWorkspace.connected ? "Connected" : "Disconnected"}</span>
                <span>·</span>
                <PlanBadge plan={currentWorkspace.plan} />
              </div>
            </button>
          )}
        </PopoverTrigger>

        <PopoverContent
          align={isCompact ? "start" : "start"}
          sideOffset={isCompact ? 8 : 4}
          className="w-[300px] rounded-[10px] border border-[var(--hairline)] bg-[var(--surface)] p-0 shadow-xl"
          onKeyDown={handleKeyDown}
        >
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {/* Search */}
            <div className="flex items-center gap-2 border-b border-[var(--hairline)] px-3 py-2.5">
              <Search className="size-3.5 shrink-0 text-[var(--ink-muted)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setFocusedIndex(-1);
                }}
                placeholder="Search workspaces…"
                className="min-w-0 flex-1 bg-transparent text-[13px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] outline-none"
                autoFocus
              />
            </div>

            <ScrollArea className="max-h-[320px]">
              <div ref={listRef} className="py-1.5">
                {/* Current workspace */}
                <div className="px-2.5 pb-1">
                  <div className="mb-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--ink-muted)]">
                    Current
                  </div>
                  <WorkspaceItem
                    workspace={currentWorkspace}
                    isCurrent
                    isSelected={false}
                    onSelect={handleSelect}
                  />
                </div>

                {/* Recent workspaces */}
                {recentWorkspaces.length > 0 && (
                  <>
                    <Separator className="my-1 bg-[var(--hairline-subtle)]" />
                    <div className="px-2.5 py-1">
                      <div className="mb-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--ink-muted)]">
                        Recent
                      </div>
                      {recentWorkspaces.map((ws, i) => (
                        <WorkspaceItem
                          key={ws.id}
                          workspace={ws}
                          isCurrent={false}
                          isSelected={focusedIndex === i}
                          onSelect={handleSelect}
                        />
                      ))}
                    </div>
                  </>
                )}

                {/* All workspaces */}
                {filtered.length > 0 && (
                  <>
                    <Separator className="my-1 bg-[var(--hairline-subtle)]" />
                    <div className="px-2.5 py-1">
                      <div className="mb-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--ink-muted)]">
                        {search.trim() ? "Results" : "All workspaces"}
                      </div>
                      {filtered.map((ws) => {
                        const globalIdx = allItems.findIndex((i) => i.id === ws.id);
                        return (
                          <WorkspaceItem
                            key={ws.id}
                            workspace={ws}
                            isCurrent={false}
                            isSelected={focusedIndex === globalIdx}
                            onSelect={handleSelect}
                          />
                        );
                      })}
                    </div>
                  </>
                )}

                {/* No results */}
                {filtered.length === 0 && search.trim() && (
                  <div className="px-2.5 py-4 text-center text-[12px] text-[var(--ink-muted)]">
                    No workspaces match &ldquo;{search}&rdquo;
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Create new workspace button */}
            <Separator className="bg-[var(--hairline-subtle)]" />
            <div className="px-2.5 py-2">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setCreateOpen(true);
                }}
                className="flex w-full items-center gap-2 rounded-[6px] px-2.5 py-2 text-[13px] font-medium text-[var(--ink-secondary)] transition-colors hover:bg-[var(--recovery-light)] hover:text-[var(--recovery-green)]"
              >
                <Plus className="size-4" />
                Create new workspace
              </button>
            </div>
          </motion.div>
        </PopoverContent>
      </Popover>

      {/* Create workspace dialog */}
      <CreateWorkspaceDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
