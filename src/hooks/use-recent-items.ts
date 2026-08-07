"use client";

import { useState, useCallback, useSyncExternalStore } from "react";
import type { LucideIcon } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────

export interface RecentItem {
  id: string;
  label: string;
  href: string;
  icon: string; // serialized icon name (e.g. "LayoutDashboard")
  timestamp: number;
}

const STORAGE_KEY = "rescueloop-recent-items";
const MAX_ITEMS = 5;

// ── Helpers ────────────────────────────────────────────────────

function readItems(): RecentItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeItems(items: RecentItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // localStorage may be unavailable (SSR, quota)
  }
}

// ── External store for recent items ────────────────────────────
// Using useSyncExternalStore avoids the "setState in effect" lint
// error and handles SSR hydration gracefully.

let cachedItems: RecentItem[] | null = null;
let listeners: Array<() => void> = [];

function subscribe(listener: () => void): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getSnapshot(): RecentItem[] {
  if (cachedItems === null) {
    cachedItems = readItems();
  }
  return cachedItems;
}

function getServerSnapshot(): RecentItem[] {
  return [];
}

function emitChange(items: RecentItem[]): void {
  cachedItems = items;
  writeItems(items);
  for (const l of listeners) l();
}

// ── Hook ───────────────────────────────────────────────────────

/**
 * Tracks recently visited pages in localStorage (max 5).
 * Items are auto-deduplicated by id — re-visiting an existing item
 * bumps it to the top with a fresh timestamp.
 */
export function useRecentItems() {
  const recentItems = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const addItem = useCallback(
    (item: Omit<RecentItem, "timestamp">) => {
      const prev = getSnapshot();
      // Remove existing entry with same id, then prepend
      const filtered = prev.filter((i) => i.id !== item.id);
      const next: RecentItem[] = [
        { ...item, timestamp: Date.now() },
        ...filtered,
      ].slice(0, MAX_ITEMS);
      emitChange(next);
    },
    [],
  );

  const clearItems = useCallback(() => {
    emitChange([]);
  }, []);

  return { recentItems, addItem, clearItems };
}

// ── Icon serialization helpers ─────────────────────────────────

/**
 * Map a Lucide icon component to a stable string name for storage.
 * Uses the component's `displayName` or `name` property.
 */
export function serializeIcon(icon: LucideIcon): string {
  return (icon as unknown as { displayName?: string }).displayName ?? icon.name ?? "File";
}
