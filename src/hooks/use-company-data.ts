"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { CompanyDataBundle, CompanyContext, CompanyOverview } from "@/lib/company-data";

// ── Generic fetch hook with loading/error states ─────────────
interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useCompanyFetch<T>(
  companyId: string,
  path: string,
  fallback: T | null = null,
): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);
  // Track whether we've ever kicked off a fetch for this (companyId, path)
  // pair so we don't double-fetch on re-renders.
  const fetchedKeyRef = useRef<string | null>(null);

  // Core fetch routine — only schedules async state updates, never
  // calls setState synchronously. Safe to invoke from effects.
  const runFetch = useCallback(() => {
    const reqId = ++requestIdRef.current;

    fetch(`/api/dashboard/${companyId}${path}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (!mountedRef.current || reqId !== requestIdRef.current) return;
        setData(json.data as T);
        setError(null);
        setLoading(false);
      })
      .catch((err) => {
        if (!mountedRef.current || reqId !== requestIdRef.current) return;
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      });
  }, [companyId, path]);

  useEffect(() => {
    mountedRef.current = true;
    const key = `${companyId}:${path}`;
    if (fetchedKeyRef.current !== key) {
      fetchedKeyRef.current = key;
      runFetch();
    }
    return () => {
      mountedRef.current = false;
    };
  }, [runFetch, companyId, path]);

  // Manual refetch — called from event handlers, so synchronous setState is fine.
  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    runFetch();
  }, [runFetch]);

  return { data, loading, error, refetch };
}

// ── Company context hook ─────────────────────────────────────
export function useCompanyContext(companyId: string) {
  return useCompanyFetch<CompanyContext>(companyId, "/context");
}

// ── Company overview hook ────────────────────────────────────
export function useCompanyOverview(companyId: string) {
  return useCompanyFetch<CompanyOverview>(companyId, "/overview");
}

// ── Full data bundle hook ────────────────────────────────────
export function useCompanyDataBundle(companyId: string) {
  return useCompanyFetch<CompanyDataBundle>(companyId, "/bundle");
}
