"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Clock,
  Users,
  BookOpen,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────
export interface SearchResult {
  id: string;
  label: string;
  category: "Members" | "Playbooks" | "Responses";
  detail?: string;
}

interface GlobalSearchBarProps {
  placeholder?: string;
  recentSearchesKey?: string; // localStorage key
  onSearch?: (query: string) => void;
  onSelect?: (result: SearchResult) => void;
  onQueryChange?: (query: string) => void;
  className?: string;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Members: Users,
  Playbooks: BookOpen,
  Responses: MessageSquare,
};

const CATEGORY_COLORS: Record<string, string> = {
  Members: "text-[var(--info)]",
  Playbooks: "text-[var(--recovery-green)]",
  Responses: "text-[var(--warning)]",
};

const MAX_RECENT = 5;
const DEBOUNCE_MS = 300;

// ── Demo search results (simulated) ───────────────────────────
const DEMO_RESULTS: SearchResult[] = [
  { id: "m1", label: "Sarah Chen", category: "Members", detail: "CS 101 · At Risk" },
  { id: "m2", label: "James Wilson", category: "Members", detail: "Data Sci · Active" },
  { id: "m3", label: "Maria Garcia", category: "Members", detail: "UX Design · Paused" },
  { id: "m4", label: "Alex Kim", category: "Members", detail: "CS 101 · Inactive" },
  { id: "m5", label: "Priya Patel", category: "Members", detail: "ML Eng · Active" },
  { id: "p1", label: "Churn Prevention", category: "Playbooks", detail: "Auto · 3 steps" },
  { id: "p2", label: "Re-engagement Flow", category: "Playbooks", detail: "Manual · 5 steps" },
  { id: "p3", label: "Payment Recovery", category: "Playbooks", detail: "Auto · 2 steps" },
  { id: "r1", label: "Continue course", category: "Responses", detail: "Email template" },
  { id: "r2", label: "I need help", category: "Responses", detail: "DM template" },
  { id: "r3", label: "Check-in reminder", category: "Responses", detail: "Scheduled" },
];

function searchResults(query: string): SearchResult[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return DEMO_RESULTS.filter(
    (r) =>
      r.label.toLowerCase().includes(q) ||
      (r.detail && r.detail.toLowerCase().includes(q)),
  );
}

// ── localStorage helpers ──────────────────────────────────────
function getRecentSearches(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(key: string, query: string) {
  if (typeof window === "undefined") return;
  try {
    const existing = getRecentSearches(key);
    const next = [query, ...existing.filter((s) => s !== query)].slice(
      0,
      MAX_RECENT,
    );
    localStorage.setItem(key, JSON.stringify(next));
  } catch {
    // localStorage unavailable
  }
}

function removeRecentSearch(key: string, query: string) {
  if (typeof window === "undefined") return;
  try {
    const existing = getRecentSearches(key);
    const next = existing.filter((s) => s !== query);
    localStorage.setItem(key, JSON.stringify(next));
  } catch {
    // localStorage unavailable
  }
}

// ── Component ─────────────────────────────────────────────────
export function GlobalSearchBar({
  placeholder = "Search members, playbooks, responses…",
  recentSearchesKey = "rescueloop-recent-searches",
  onSearch,
  onSelect,
  onQueryChange,
  className,
}: GlobalSearchBarProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches(recentSearchesKey));
  }, [recentSearchesKey]);

  // Debounce query
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(query);
      onQueryChange?.(query);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, onQueryChange]);

  // Results from debounced query
  const results = searchResults(debouncedQuery);

  // Group results by category
  const groupedResults = results.reduce<
    Record<string, SearchResult[]>
  >((acc, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    acc[r.category].push(r);
    return acc;
  }, {});

  const handleSelect = useCallback(
    (value: string) => {
      // value is the result id
      const result = DEMO_RESULTS.find((r) => r.id === value);
      if (result) {
        saveRecentSearch(recentSearchesKey, result.label);
        setRecentSearches(getRecentSearches(recentSearchesKey));
        onSelect?.(result);
      } else {
        // It's a recent search string
        saveRecentSearch(recentSearchesKey, value);
        setRecentSearches(getRecentSearches(recentSearchesKey));
        onSearch?.(value);
      }
      setQuery("");
      setOpen(false);
    },
    [onSelect, onSearch, recentSearchesKey],
  );

  const handleOpen = useCallback(() => {
    setOpen(true);
    setRecentSearches(getRecentSearches(recentSearchesKey));
  }, [recentSearchesKey]);

  return (
    <div className={cn("relative", className)}>
      {/* Trigger button (the search bar itself) */}
      <button
        type="button"
        onClick={handleOpen}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-[10px] border border-[var(--hairline)] bg-[var(--surface)] px-3.5 py-2.5 text-left transition-all",
          "hover:border-[var(--hairline-strong)] hover:bg-[var(--canvas-elevated)]",
          "focus:border-[var(--recovery-green)]/40 focus:ring-2 focus:ring-[var(--recovery-green)]/15 focus:outline-none",
          "group",
        )}
      >
        <Search className="size-4 shrink-0 text-[var(--ink-muted)] group-focus:text-[var(--recovery-green)]" />
        <span className="flex-1 text-[13px] text-[var(--ink-muted)]">
          {query || placeholder}
        </span>
        <kbd className="hidden rounded-[4px] border border-[var(--hairline)] bg-[var(--canvas-elevated)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--ink-muted)] sm:inline-block">
          ⌘K
        </kbd>
      </button>

      {/* Command palette overlay */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 bg-[var(--ink-primary)]/20 backdrop-blur-[2px]"
              onClick={() => setOpen(false)}
            />

            {/* Command dialog */}
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed left-1/2 top-[15%] z-50 w-full max-w-[520px] -translate-x-1/2"
            >
              <Command
                className="rounded-[10px] border border-[var(--hairline-strong)] bg-[var(--surface)] shadow-[0_12px_40px_-8px_rgba(17,17,15,0.18)]"
                loop
              >
                {/* Search input */}
                <div className="flex items-center border-b border-[var(--hairline)] px-3">
                  <Search className="size-4 shrink-0 text-[var(--ink-muted)]" />
                  <CommandInput
                    ref={inputRef}
                    placeholder={placeholder}
                    value={query}
                    onValueChange={setQuery}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        e.preventDefault();
                        setOpen(false);
                      }
                    }}
                    className="h-10 border-0 text-[13px] placeholder:text-[var(--ink-muted)] focus:ring-0"
                  />
                </div>

                <CommandList className="max-h-[320px] overflow-y-auto p-1">
                  <CommandEmpty className="py-6 text-center text-[12px] text-[var(--ink-muted)]">
                    No results found for &ldquo;{debouncedQuery}&rdquo;
                  </CommandEmpty>

                  {/* Recent searches (shown when no query) */}
                  {!debouncedQuery && recentSearches.length > 0 && (
                    <CommandGroup
                      heading="Recent"
                      className="[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.06em] [&_[cmdk-group-heading]]:text-[var(--ink-muted)]"
                    >
                      {recentSearches.map((search) => (
                        <CommandItem
                          key={`recent-${search}`}
                          value={`recent-${search}`}
                          onSelect={() => handleSelect(search)}
                          className="flex cursor-pointer items-center gap-2.5 rounded-[6px] px-2.5 py-2 text-[12px] text-[var(--ink-secondary)] data-[selected=true]:bg-[var(--canvas-elevated)]"
                        >
                          <Clock className="size-3.5 text-[var(--ink-muted)]" />
                          <span className="flex-1">{search}</span>
                          <ArrowRight className="size-3 text-[var(--ink-muted)] opacity-0 group-hover:opacity-100" />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {/* Grouped search results */}
                  {debouncedQuery &&
                    Object.entries(groupedResults).map(
                      ([category, items]) => {
                        const Icon = CATEGORY_ICONS[category];
                        const color =
                          CATEGORY_COLORS[category] ??
                          "text-[var(--ink-secondary)]";
                        return (
                          <CommandGroup
                            key={category}
                            heading={category}
                            className="[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.06em] [&_[cmdk-group-heading]]:text-[var(--ink-muted)]"
                          >
                            {items.map((item) => (
                              <CommandItem
                                key={item.id}
                                value={item.id}
                                onSelect={() =>
                                  handleSelect(item.id)
                                }
                                className="flex cursor-pointer items-center gap-2.5 rounded-[6px] px-2.5 py-2 text-[12px] data-[selected=true]:bg-[var(--canvas-elevated)]"
                              >
                                {Icon && (
                                  <Icon
                                    className={cn(
                                      "size-3.5",
                                      color,
                                    )}
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <span className="text-[var(--ink-primary)]">
                                    {item.label}
                                  </span>
                                  {item.detail && (
                                    <span className="ml-1.5 text-[var(--ink-muted)]">
                                      · {item.detail}
                                    </span>
                                  )}
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        );
                      },
                    )}
                </CommandList>

                {/* Footer hint */}
                <div className="flex items-center justify-between border-t border-[var(--hairline)] px-3 py-2 text-[10px] text-[var(--ink-muted)]">
                  <span>navigate with ↑↓</span>
                  <span>↵ select · esc close</span>
                </div>
              </Command>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Global keyboard shortcut */}
      <KeyboardShortcut onOpen={handleOpen} />
    </div>
  );
}

/** ⌘K / Ctrl+K shortcut listener */
function KeyboardShortcut({ onOpen }: { onOpen: () => void }) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpen();
      }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onOpen]);

  return null;
}
