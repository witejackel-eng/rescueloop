"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

export function ManualSyncButton() {
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runSync() {
    setIsSyncing(true);
    setError(null);

    try {
      const response = await fetch("/api/sync/manual", { method: "POST" });
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(body?.error ?? `Sync failed with status ${response.status}`);
      }

      router.refresh();
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : "Sync failed");
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={runSync}
        disabled={isSyncing}
        className="press inline-flex items-center gap-2 rounded-[8px] bg-[var(--ink-primary)] px-4 py-2.5 text-[13px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        <RefreshCw className={`size-4 ${isSyncing ? "animate-spin" : ""}`} />
        {isSyncing ? "Syncing Whop…" : "Run Whop sync"}
      </button>
      {error ? (
        <p className="max-w-xs text-right text-[12px] text-[var(--critical)]">{error}</p>
      ) : null}
    </div>
  );
}
