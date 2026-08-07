"use client";

import { useState } from "react";
import {
  Download,
  Share2,
  FileJson,
  FileSpreadsheet,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ExportDataButtonProps {
  /** Called when user selects CSV export. Should return the CSV string. */
  onExportCSV?: () => string;
  /** Called when user selects JSON export. Should return the JSON string. */
  onExportJSON?: () => string;
  /** Page label for the share message. */
  pageLabel?: string;
  className?: string;
}

/**
 * Dashboard export/share dropdown button.
 * Supports CSV download, JSON download, and clipboard share link.
 */
export function ExportDataButton({
  onExportCSV,
  onExportJSON,
  pageLabel = "Dashboard",
  className,
}: ExportDataButtonProps) {
  const [copied, setCopied] = useState(false);

  function handleCSV() {
    if (!onExportCSV) return;
    const csv = onExportCSV();
    downloadFile(csv, `${pageLabel.toLowerCase().replace(/\s+/g, "-")}.csv`, "text/csv");
    toast.success("CSV exported", { description: `${pageLabel} data downloaded.` });
  }

  function handleJSON() {
    if (!onExportJSON) return;
    const json = onExportJSON();
    downloadFile(json, `${pageLabel.toLowerCase().replace(/\s+/g, "-")}.json`, "application/json");
    toast.success("JSON exported", { description: `${pageLabel} data downloaded.` });
  }

  async function handleShare() {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied", { description: "Shareable link copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-7 rounded-[6px] px-2 text-[11px] text-[var(--ink-muted)] gap-1", className)}
        >
          <Download className="size-3" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-[8px]">
        <DropdownMenuItem onClick={handleCSV} disabled={!onExportCSV} className="gap-2 text-[12px]">
          <FileSpreadsheet className="size-3.5 text-[var(--recovery-green)]" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleJSON} disabled={!onExportJSON} className="gap-2 text-[12px]">
          <FileJson className="size-3.5 text-[var(--info)]" />
          Export as JSON
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleShare} className="gap-2 text-[12px]">
          {copied ? (
            <Check className="size-3.5 text-[var(--recovery-green)]" />
          ) : (
            <Share2 className="size-3.5 text-[var(--ink-muted)]" />
          )}
          {copied ? "Link copied" : "Copy share link"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
