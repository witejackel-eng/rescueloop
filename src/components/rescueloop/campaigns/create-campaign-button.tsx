"use client";

import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CreateCampaignButton() {
  return (
    <Button
      variant="default"
      size="sm"
      className="gap-1.5 bg-[#147D68] text-white hover:bg-[#147D68]/90"
      onClick={() => toast.info("Coming soon", { description: "Campaign templates are on the roadmap." })}
    >
      <Plus className="size-4" />
      Create campaign
    </Button>
  );
}
