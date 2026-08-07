"use client";

import { useState } from "react";
import { Download, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DiagnosticBundle } from "@/lib/types/operations-internal";

interface DiagnosticExportProps {
  bundle: DiagnosticBundle;
}

export function DiagnosticExport({ bundle }: DiagnosticExportProps) {
  const [exported, setExported] = useState(false);

  const handleExport = () => {
    // Sanitize: ensure no sensitive data leaks
    const sanitized: DiagnosticBundle = {
      ...bundle,
      diagnostics: bundle.diagnostics.map((d) => ({
        ...d,
        // Context is already defined as Record<string, string> with no sensitive data
        // but we double-check by redacting any keys that look sensitive
        context: Object.fromEntries(
          Object.entries(d.context).filter(([key]) => {
            const k = key.toLowerCase();
            return (
              !k.includes("token") &&
              !k.includes("secret") &&
              !k.includes("password") &&
              !k.includes("api_key") &&
              !k.includes("private")
            );
          })
        ),
      })),
    };

    const json = JSON.stringify(sanitized, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rescueloop-diagnostics-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      className="gap-1.5 text-[12px]"
    >
      {exported ? (
        <>
          <CheckCircle2 className="size-3.5 text-[var(--recovery-green)]" strokeWidth={2} />
          Exported
        </>
      ) : (
        <>
          <Download className="size-3.5" strokeWidth={2} />
          Export Bundle
        </>
      )}
    </Button>
  );
}
