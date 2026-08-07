"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bookmark,
  Star,
  Trash2,
  Plus,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ActiveFilters } from "@/components/shared/filter-bar";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────
export interface SavedFilterPreset {
  id: string;
  name: string;
  filters: ActiveFilters;
  starred: boolean;
  isDefault?: boolean;
  createdAt: string;
}

interface SavedFiltersProps {
  storageKey?: string;
  currentFilters?: ActiveFilters;
  onApply?: (filters: ActiveFilters, name: string) => void;
  className?: string;
}

// ── Default presets ────────────────────────────────────────────
const DEFAULT_PRESETS: SavedFilterPreset[] = [
  {
    id: "preset-at-risk",
    name: "At Risk Members",
    filters: { "Risk Level": "high", Status: "at_risk" },
    starred: true,
    isDefault: true,
    createdAt: "default",
  },
  {
    id: "preset-recent",
    name: "Recent Activity",
    filters: { "Time Range": "7d" },
    starred: false,
    isDefault: true,
    createdAt: "default",
  },
  {
    id: "preset-high-value",
    name: "High Value Recovery",
    filters: { "Risk Level": "critical", "Time Range": "30d" },
    starred: true,
    isDefault: true,
    createdAt: "default",
  },
  {
    id: "preset-needs-attention",
    name: "Needs Attention",
    filters: { Status: "at_risk", "Response Type": "manual" },
    starred: false,
    isDefault: true,
    createdAt: "default",
  },
];

// ── localStorage helpers ──────────────────────────────────────
function loadPresets(key: string): SavedFilterPreset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistPresets(key: string, presets: SavedFilterPreset[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(presets));
  } catch {
    // localStorage unavailable
  }
}

// ── Component ─────────────────────────────────────────────────
export function SavedFilters({
  storageKey = "rescueloop-saved-filters",
  currentFilters = {},
  onApply,
  className,
}: SavedFiltersProps) {
  const [customPresets, setCustomPresets] = useState<SavedFilterPreset[]>([]);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [newName, setNewName] = useState("");

  // Load custom presets from localStorage on mount
  useEffect(() => {
    setCustomPresets(loadPresets(storageKey));
  }, [storageKey]);

  const allPresets = [...DEFAULT_PRESETS, ...customPresets];
  const starredPresets = allPresets.filter((p) => p.starred);
  const otherPresets = allPresets.filter((p) => !p.starred);

  const hasActiveFilters = Object.keys(currentFilters).length > 0;

  const handleApply = useCallback(
    (preset: SavedFilterPreset) => {
      onApply?.(preset.filters, preset.name);
      toast.success(`Applied: ${preset.name}`, {
        description: `${Object.keys(preset.filters).length} filter${Object.keys(preset.filters).length === 1 ? "" : "s"} active`,
      });
    },
    [onApply],
  );

  const handleSave = useCallback(() => {
    if (!newName.trim()) {
      toast.error("Please enter a name for your filter preset");
      return;
    }
    if (!hasActiveFilters) {
      toast.error("No active filters to save");
      return;
    }
    const newPreset: SavedFilterPreset = {
      id: `preset-${Date.now()}`,
      name: newName.trim(),
      filters: { ...currentFilters },
      starred: false,
      isDefault: false,
      createdAt: new Date().toISOString(),
    };
    const next = [...customPresets, newPreset];
    setCustomPresets(next);
    persistPresets(storageKey, next);
    setNewName("");
    setShowSaveForm(false);
    toast.success("Filter preset saved", {
      description: `"${newName.trim()}" is now available in your presets.`,
    });
  }, [newName, hasActiveFilters, currentFilters, customPresets, storageKey]);

  const handleDelete = useCallback(
    (id: string, name: string) => {
      const next = customPresets.filter((p) => p.id !== id);
      setCustomPresets(next);
      persistPresets(storageKey, next);
      toast.info("Preset deleted", {
        description: `"${name}" was removed.`,
      });
    },
    [customPresets, storageKey],
  );

  const handleToggleStar = useCallback(
    (id: string) => {
      // If it's a default preset, we can't star/unstar it (or we could track that)
      // For custom presets, toggle star
      const next = customPresets.map((p) =>
        p.id === id ? { ...p, starred: !p.starred } : p,
      );
      setCustomPresets(next);
      persistPresets(storageKey, next);
    },
    [customPresets, storageKey],
  );

  const activeFilterCount = Object.keys(currentFilters).length;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 rounded-full border-[var(--hairline)] bg-[var(--surface)] px-2.5 text-[11px] text-[var(--ink-secondary)] hover:border-[var(--hairline-strong)] hover:bg-[var(--canvas-elevated)]"
          >
            <Bookmark className="size-3" />
            Saved
            {activeFilterCount > 0 && (
              <span className="ml-0.5 rounded-full bg-[var(--recovery-green)]/15 px-1 text-[9px] font-medium text-[var(--recovery-green)]">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          className="w-[220px] rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] p-1 shadow-lg"
        >
          <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-muted)]">
            Filter Presets
          </DropdownMenuLabel>

          {/* Starred presets */}
          {starredPresets.length > 0 && (
            <>
              <DropdownMenuSeparator />
              {starredPresets.map((preset) => (
                <PresetItem
                  key={preset.id}
                  preset={preset}
                  onApply={handleApply}
                  onDelete={handleDelete}
                  onToggleStar={handleToggleStar}
                />
              ))}
            </>
          )}

          {/* Other presets */}
          {otherPresets.length > 0 && (
            <>
              <DropdownMenuSeparator />
              {otherPresets.map((preset) => (
                <PresetItem
                  key={preset.id}
                  preset={preset}
                  onApply={handleApply}
                  onDelete={handleDelete}
                  onToggleStar={handleToggleStar}
                />
              ))}
            </>
          )}

          {/* Save current filters */}
          <DropdownMenuSeparator />
          {showSaveForm ? (
            <div className="px-2 py-1.5 space-y-2">
              <Input
                autoFocus
                placeholder="Preset name…"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") {
                    setShowSaveForm(false);
                    setNewName("");
                  }
                }}
                className="h-7 rounded-[4px] border-[var(--hairline)] text-[11px]"
              />
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={!hasActiveFilters || !newName.trim()}
                  className="h-6 rounded-[4px] bg-[var(--ink-primary)] px-2 text-[10px] text-white hover:bg-[var(--ink-primary)]/90"
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowSaveForm(false);
                    setNewName("");
                  }}
                  className="h-6 rounded-[4px] px-1.5 text-[10px]"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <DropdownMenuItem
              onSelect={() => setShowSaveForm(true)}
              disabled={!hasActiveFilters}
              className="rounded-[6px] text-[11px] text-[var(--ink-secondary)]"
            >
              <Plus className="size-3" />
              Save current filters
              {!hasActiveFilters && (
                <span className="ml-auto text-[9px] text-[var(--ink-muted)]">
                  No filters
                </span>
              )}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ── Preset item sub-component ─────────────────────────────────
function PresetItem({
  preset,
  onApply,
  onDelete,
  onToggleStar,
}: {
  preset: SavedFilterPreset;
  onApply: (preset: SavedFilterPreset) => void;
  onDelete: (id: string, name: string) => void;
  onToggleStar: (id: string) => void;
}) {
  const filterCount = Object.keys(preset.filters).length;

  return (
    <DropdownMenuItem
      className="group rounded-[6px] text-[12px]"
      onSelect={() => onApply(preset)}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleStar(preset.id);
        }}
        className="flex size-4 items-center justify-center rounded p-0 text-[var(--ink-muted)] transition-colors hover:text-[var(--warning)]"
        aria-label={preset.starred ? "Unstar preset" : "Star preset"}
      >
        <Star
          className={cn(
            "size-3",
            preset.starred && "fill-[var(--warning)] text-[var(--warning)]",
          )}
        />
      </button>
      <span className="flex-1 text-[var(--ink-primary)]">{preset.name}</span>
      <span className="font-mono text-[9px] tabular-nums text-[var(--ink-muted)]">
        {filterCount}
      </span>
      {!preset.isDefault && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(preset.id, preset.name);
          }}
          className="flex size-4 items-center justify-center rounded p-0 text-[var(--ink-muted)] opacity-0 transition-all group-hover:opacity-100 hover:text-[var(--critical)]"
          aria-label={`Delete preset: ${preset.name}`}
        >
          <Trash2 className="size-3" />
        </button>
      )}
    </DropdownMenuItem>
  );
}
