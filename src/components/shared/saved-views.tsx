"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bookmark,
  BookmarkCheck,
  Plus,
  X,
  Star,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export interface SavedView {
  id: string;
  name: string;
  filter: string;
  count: number;
  createdAt: string;
  starred?: boolean;
}

interface SavedViewsProps {
  views: SavedView[];
  activeViewId: string | null;
  onSelect: (view: SavedView) => void;
  onSave: (name: string) => void;
  onDelete: (id: string) => void;
  onToggleStar: (id: string) => void;
  currentFilterLabel: string;
  currentCount: number;
}

export function SavedViews({
  views,
  activeViewId,
  onSelect,
  onSave,
  onDelete,
  onToggleStar,
  currentFilterLabel,
  currentCount,
}: SavedViewsProps) {
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [name, setName] = useState("");

  function handleSave() {
    if (!name.trim()) {
      toast.error("Please enter a name for your view");
      return;
    }
    onSave(name.trim());
    setName("");
    setShowSaveForm(false);
    toast.success("View saved", {
      description: `"${name.trim()}" is now available in your saved views.`,
    });
  }

  function handleDelete(id: string, name: string) {
    onDelete(id);
    toast.info("View deleted", {
      description: `"${name}" was removed from your saved views.`,
    });
  }

  const starredViews = views.filter((v) => v.starred);
  const otherViews = views.filter((v) => !v.starred);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-muted)]">
          <Bookmark className="size-3" />
          Saved Views
        </span>
        <button
          onClick={() => setShowSaveForm((v) => !v)}
          className="flex items-center gap-1 text-[10px] font-medium text-[var(--ink-secondary)] transition-colors hover:text-[var(--ink-primary)]"
          aria-label="Save current view"
        >
          <Plus className="size-2.5" />
          Save current
        </button>
      </div>

      {/* Save form */}
      <AnimatePresence>
        {showSaveForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 rounded-[6px] border border-[var(--hairline)] bg-[var(--surface)] p-2">
              <Input
                autoFocus
                placeholder="View name (e.g. Urgent cancellations)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") {
                    setShowSaveForm(false);
                    setName("");
                  }
                }}
                className="h-7 rounded-[4px] border-[var(--hairline)] text-[11px]"
              />
              <Button
                size="sm"
                onClick={handleSave}
                className="h-7 shrink-0 rounded-[4px] bg-[var(--ink-primary)] px-2 text-[11px] text-white hover:bg-[var(--ink-primary)]/90"
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowSaveForm(false);
                  setName("");
                }}
                className="h-7 shrink-0 rounded-[4px] px-1.5 text-[11px]"
                aria-label="Cancel save"
              >
                <X className="size-3" />
              </Button>
            </div>
            <p className="mt-1.5 px-1 text-[10px] text-[var(--ink-muted)]">
              Saving: <span className="font-medium text-[var(--ink-secondary)]">{currentFilterLabel}</span> ({currentCount} students)
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Starred views */}
      {starredViews.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {starredViews.map((view) => (
            <SavedViewChip
              key={view.id}
              view={view}
              active={activeViewId === view.id}
              onSelect={() => onSelect(view)}
              onDelete={() => handleDelete(view.id, view.name)}
              onToggleStar={() => onToggleStar(view.id)}
            />
          ))}
        </div>
      )}

      {/* Other views */}
      {otherViews.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {otherViews.map((view) => (
            <SavedViewChip
              key={view.id}
              view={view}
              active={activeViewId === view.id}
              onSelect={() => onSelect(view)}
              onDelete={() => handleDelete(view.id, view.name)}
              onToggleStar={() => onToggleStar(view.id)}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {views.length === 0 && !showSaveForm && (
        <p className="text-[11px] text-[var(--ink-muted)]">
          No saved views yet. Save your favorite filter combinations for quick access.
        </p>
      )}
    </div>
  );
}

function SavedViewChip({
  view,
  active,
  onSelect,
  onDelete,
  onToggleStar,
}: {
  view: SavedView;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onToggleStar: () => void;
}) {
  return (
    <div
      className={cn(
        "group flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-all",
        active
          ? "border-[var(--ink-primary)] bg-[var(--ink-primary)] text-white"
          : "border-[var(--hairline)] bg-[var(--surface)] text-[var(--ink-secondary)] hover:border-[var(--hairline-strong)] hover:bg-[var(--canvas-elevated)]",
      )}
    >
      <button
        onClick={onSelect}
        className="flex items-center gap-1.5"
        aria-label={`Apply saved view: ${view.name}`}
      >
        {view.starred && (
          <Star className={cn("size-2.5", active ? "fill-white text-white" : "fill-[var(--warning)] text-[var(--warning)]")} />
        )}
        <span className="font-medium">{view.name}</span>
        <span
          className={cn(
            "font-mono text-[10px] tabular-nums",
            active ? "text-white/70" : "text-[var(--ink-muted)]",
          )}
        >
          {view.count}
        </span>
      </button>
      <button
        onClick={onToggleStar}
        className={cn(
          "rounded p-0.5 transition-colors",
          active ? "text-white/60 hover:bg-white/10 hover:text-white" : "text-[var(--ink-muted)] hover:bg-[var(--canvas)] hover:text-[var(--warning)]",
        )}
        aria-label={view.starred ? "Unstar view" : "Star view"}
      >
        <Star className={cn("size-2.5", view.starred && "fill-current")} />
      </button>
      <button
        onClick={onDelete}
        className={cn(
          "rounded p-0.5 opacity-0 transition-all group-hover:opacity-100",
          active ? "text-white/60 hover:bg-white/10 hover:text-white" : "text-[var(--ink-muted)] hover:bg-[var(--canvas)] hover:text-[var(--critical)]",
        )}
        aria-label={`Delete view: ${view.name}`}
      >
        <Trash2 className="size-2.5" />
      </button>
    </div>
  );
}
