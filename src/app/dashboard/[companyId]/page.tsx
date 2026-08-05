import { headers } from "next/headers";
import Link from "next/link";

import { whopsdk } from "@/lib/whop-sdk";

type DashboardPageProps = {
  params: Promise<{ companyId: string }>;
};

export default async function WhopDashboardPage({
  params,
}: DashboardPageProps) {
  const { companyId } = await params;

  if (!companyId.startsWith("biz_")) {
    return <AccessState title="Invalid company" detail="The company ID must begin with biz_." />;
  }

  try {
    const { userId } = await whopsdk.verifyUserToken(await headers());
    const access = await whopsdk.users.checkAccess(companyId, { id: userId });

    if (access.access_level !== "admin") {
      return (
        <AccessState
          title="Admin access required"
          detail="Open RescueLoop from a Whop company where you are a team member."
        />
      );
    }

    return (
      <main className="min-h-screen bg-[var(--canvas)] px-6 py-12 text-[var(--ink-primary)]">
        <div className="mx-auto max-w-3xl rounded-2xl border border-[var(--hairline)] bg-[var(--surface)] p-8">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--recovery-green)]">
            Whop authenticated
          </p>
          <h1 className="mt-3 font-serif text-4xl">RescueLoop is connected</h1>
          <p className="mt-4 text-[var(--ink-secondary)]">
            Company <code>{companyId}</code> is authorized and the current Whop user has admin access.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/overview"
              className="rounded-lg bg-[var(--ink-primary)] px-4 py-2 text-sm font-medium text-white"
            >
              Open current workspace
            </Link>
            <Link
              href="/api/whop/connection"
              className="rounded-lg border border-[var(--hairline)] px-4 py-2 text-sm font-medium"
            >
              Test Whop data access
            </Link>
          </div>
        </div>
      </main>
    );
  } catch (error) {
    console.error("Whop dashboard authentication failed", error);

    return (
      <AccessState
        title="Open RescueLoop inside Whop"
        detail="Whop supplies the secure user token only when this dashboard view is opened from the Whop interface."
      />
    );
  }
}

function AccessState({ title, detail }: { title: string; detail: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--canvas)] px-6 text-[var(--ink-primary)]">
      <div className="max-w-lg rounded-2xl border border-[var(--hairline)] bg-[var(--surface)] p-8 text-center">
        <h1 className="font-serif text-3xl">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--ink-secondary)]">{detail}</p>
      </div>
    </main>
  );
}
