import Link from "next/link";
import { ArrowRight, ShieldCheck, Activity, TrendingUp, Users } from "lucide-react";
import { RescueLoopLogo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { KPIS, COMPANY, COURSE, PRODUCT } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/format";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F4F4F1]">
      <header className="border-b border-[#E3E5DF] bg-[#FFFFFF]">
        <div className="mx-auto flex h-16 max-w-[1100px] items-center justify-between px-4 lg:px-6">
          <RescueLoopLogo />
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/onboarding">Start onboarding</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/overview">
                View demo
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col items-center justify-center px-4 py-12 lg:px-6">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#E3E5DF] bg-[#FFFFFF] px-3 py-1 text-xs font-medium text-[#6A706A]">
          <span className="size-1.5 rounded-full bg-[#27966A]" />
          Demo workspace · {COMPANY.name}
        </div>
        <h1 className="max-w-2xl text-center text-3xl font-semibold tracking-tight text-[#171A17] sm:text-4xl lg:text-5xl">
          Recover more value from the members you already have.
        </h1>
        <p className="mt-4 max-w-xl text-center text-base text-[#6A706A] sm:text-lg">
          RescueLoop identifies Whop members who never started, stopped
          progressing, or may cancel — and sends respectful, high-signal
          recovery interventions.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/overview">
              View the demo dashboard
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/onboarding">Start onboarding instead</Link>
          </Button>
        </div>

        <p className="mt-4 text-sm text-[#6A706A]">
          Nothing is sent automatically in the demo. You review every rescue candidate.
        </p>

        {/* Demo stats */}
        <div className="mt-12 grid w-full grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            {
              icon: Users,
              label: "Students monitored",
              value: KPIS.totalStudents.toLocaleString(),
              sub: COURSE.name,
            },
            {
              icon: Activity,
              label: "At-risk detected",
              value: KPIS.atRiskStudents.toLocaleString(),
              sub: "Across 4 risk segments",
            },
            {
              icon: ShieldCheck,
              label: "Students rescued",
              value: KPIS.studentsReengaged.toLocaleString(),
              sub: "Returned after intervention",
            },
            {
              icon: TrendingUp,
              label: "Confirmed value recovered",
              value: formatCurrency(KPIS.confirmedRecoveredRevenue),
              sub: `${formatCurrency(KPIS.estimated90DayRetainedValue)} estimated`,
            },
          ].map((stat) => (
            <Card key={stat.label} className="gap-0 py-4">
              <CardHeader className="px-4">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-[#E8F5EF]">
                    <stat.icon className="size-4 text-[#147D68]" />
                  </div>
                  <CardDescription className="text-xs">{stat.label}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="px-4">
                <p className="tabular-mono text-2xl font-semibold text-[#171A17]">
                  {stat.value}
                </p>
                <p className="mt-0.5 text-xs text-[#6A706A]">{stat.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center text-xs text-[#6A706A]">
          Product: {PRODUCT.name} · {formatCurrency(PRODUCT.price)}/month · Course: {COURSE.name}
        </div>
      </main>
    </div>
  );
}
