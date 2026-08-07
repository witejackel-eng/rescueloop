"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, CheckCircle2, Wifi, RefreshCw, AlertCircle } from "lucide-react";
import { useState } from "react";

export default function DiagnosticsPage() {
  const [copied, setCopied] = useState(false);

  const diagnosticSummary = `RescueLoop Diagnostic Summary
============================
Release SHA: abc1234
Company ID: co_cgl
Whop connection: Connected
Sync status: Active (last sync: 2 min ago)
Health: 8/9 domains healthy (Webhooks: Degraded)
Last successful sync: 2 minutes ago
Browser: Modern (WebRTC supported)`;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-[24px] text-[var(--ink-primary)]">Diagnostics</h1>
        <p className="mt-1 text-[13px] text-[var(--ink-secondary)]">Share this summary with support if you need help</p>
      </div>

      <Card className="rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] p-5">
        <div className="space-y-3 text-[12px]">
          {[
            ["Release SHA", "abc1234"],
            ["Company ID", "co_cgl"],
            ["Whop connection", "Connected"],
            ["Sync status", "Active"],
            ["Health", "8/9 domains healthy"],
            ["Last successful sync", "2 minutes ago"],
            ["Browser", "Modern (WebRTC supported)"],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between">
              <span className="text-[var(--ink-muted)]">{label}</span>
              <span className="font-mono text-[var(--ink-primary)]">{value}</span>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <Button
            variant="outline"
            size="sm"
            className="rounded-[6px] text-[11px]"
            onClick={() => {
              navigator.clipboard?.writeText(diagnosticSummary);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? <CheckCircle2 className="mr-1.5 size-3.5" /> : <Copy className="mr-1.5 size-3.5" />}
            Copy diagnostic summary
          </Button>
        </div>
      </Card>

      <Card className="rounded-[8px] border border-[var(--critical)]/20 bg-[var(--critical-light)]/20 p-4">
        <p className="text-[11px] text-[var(--critical)]">
          This summary never includes secrets, API keys, DATABASE_URL, authorization tokens, student link tokens, webhook payloads, or student message content.
        </p>
      </Card>
    </div>
  );
}
