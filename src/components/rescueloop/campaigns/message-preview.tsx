"use client";

import { useState } from "react";
import { Monitor, Send, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PREVIEW_VARS: Record<string, string> = {
  first_name: "Maya",
  course_name: "Agency Growth System",
  lesson_duration: "8 minutes",
  current_lesson: "Setting Up Your First Campaign",
  progress_percent: "38%",
};

function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
    vars[key] ?? `{{${key}}}`,
  );
}

function extractVariables(template: string): string[] {
  const matches = template.matchAll(/\{\{(\w+)\}\}/g);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const m of matches) {
    if (!seen.has(m[1])) {
      seen.add(m[1]);
      out.push(m[1]);
    }
  }
  return out;
}

export function MessagePreview({ template }: { template: string }) {
  const [view, setView] = useState<"desktop" | "mobile">("mobile");

  const filled = fillTemplate(template, PREVIEW_VARS);
  const variableNames = extractVariables(template);

  return (
    <Card className="gap-0">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-semibold text-[#171A17]">
              Message preview
            </CardTitle>
            <CardDescription className="mt-0.5 text-xs text-[#6A706A]">
              How this message appears to students
            </CardDescription>
          </div>
          <div className="flex items-center gap-0.5 rounded-md border border-[#E3E5DF] bg-[#F8F8F5] p-0.5">
            <PreviewToggle
              active={view === "desktop"}
              onClick={() => setView("desktop")}
              label="Desktop"
            >
              <Monitor className="size-3.5" />
            </PreviewToggle>
            <PreviewToggle
              active={view === "mobile"}
              onClick={() => setView("mobile")}
              label="Mobile"
            >
              <Smartphone className="size-3.5" />
            </PreviewToggle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Preview frame */}
        <div
          className={cn(
            "mx-auto rounded-2xl border border-[#E3E5DF] bg-[#FFFFFF] p-4 transition-all",
            view === "mobile" ? "max-w-[340px]" : "w-full",
          )}
        >
          {/* Sender row */}
          <div className="mb-3 flex items-center gap-2 border-b border-[#E3E5DF] pb-3">
            <div className="flex size-7 items-center justify-center rounded-full bg-[#147D68] text-[10px] font-semibold text-white">
              CR
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-[#171A17]">Creator Growth Lab</p>
              <p className="text-[11px] text-[#6A706A]">Direct message</p>
            </div>
          </div>
          {/* Message body */}
          <div className="rounded-2xl rounded-tl-sm border border-[#E3E5DF] bg-[#F8F8F5] px-4 py-3">
            <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-[#171A17]">
              {filled}
            </p>
          </div>
          <p className="mt-2 text-right text-[10px] text-[#6A706A]">
            Just now · Preview
          </p>
        </div>

        {/* Variables available */}
        <div className="mt-4">
          <p className="text-xs font-medium text-[#6A706A]">
            Variables available
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {variableNames.map((v) => (
              <span
                key={v}
                className="rounded-md border border-[#E3E5DF] bg-[#F8F8F5] px-1.5 py-0.5 font-mono text-[11px] text-[#147D68]"
              >
                {`{{${v}}}`}
              </span>
            ))}
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="mt-4 w-full gap-1.5 border-[#E3E5DF] text-[#171A17] hover:bg-[#F8F8F5]"
          onClick={() => toast.success("Test sent to your email")}
        >
          <Send className="size-3.5" />
          Send test preview
        </Button>
      </CardContent>
    </Card>
  );
}

function PreviewToggle({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-1.5 rounded-[5px] px-2.5 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-[#FFFFFF] text-[#171A17] shadow-sm"
          : "text-[#6A706A] hover:text-[#171A17]",
      )}
    >
      {children}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
