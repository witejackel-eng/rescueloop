"use client";

import { useParams } from "next/navigation";
import { Org360View } from "@/components/rescueloop/internal/org-360";
import { DEMO_ORG_360 } from "@/lib/demo-operations-data";

export default function Org360Page() {
  const params = useParams<{ orgId: string }>();
  const org = DEMO_ORG_360.find((o) => o.orgId === params.orgId);

  if (!org) {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <h1 className="font-serif text-[24px] text-[var(--ink-primary)]">
          Organization Not Found
        </h1>
        <p className="text-[13px] text-[var(--ink-muted)]">
          No organization with ID &quot;{params.orgId}&quot; was found.
        </p>
      </div>
    );
  }

  return <Org360View org={org} />;
}
