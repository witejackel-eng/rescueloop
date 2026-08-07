'use client'

import { useState } from "react";
import { OnboardingWizard } from "@/components/rescueloop/onboarding/onboarding-wizard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";

// Demo data for the onboarding wizard
const DEMO_COURSES = [
  { id: "course_abc123", title: "Creator Growth Accelerator", description: "Learn how to grow your creator business", lessonCount: 29 },
  { id: "course_def456", title: "Email Marketing Mastery", description: "Build and monetize your email list", lessonCount: 18 },
  { id: "course_ghi789", title: "Community Building 101", description: "Create thriving online communities", lessonCount: 12 },
];

const DEMO_PRODUCTS = [
  { id: "prod_x1", title: "Growth Membership", exists: true },
  { id: "prod_x2", title: "All-Access Pass", exists: true },
];

const DEMO_MAPPINGS: Array<{
  productId: string;
  courseId: string;
  activationDelayDays: number;
  productName: string;
  courseName: string;
  memberCount?: number;
}> = [];

export default function Home() {
  const [started, setStarted] = useState(false);

  if (started) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <OnboardingWizard
          companyId="biz_demo123"
          organizationId="org_demo456"
          courses={DEMO_COURSES}
          products={DEMO_PRODUCTS}
          existingMappings={DEMO_MAPPINGS}
          experiences={[
            { id: "exp_1", name: "Growth Experience", productId: "prod_x1" },
          ]}
          whopUnavailable={false}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-[var(--recovery-light)]">
        <ShieldCheck className="size-8 text-[var(--recovery-green)]" />
      </div>
      <Card className="max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="font-serif text-2xl">RescueLoop</CardTitle>
          <CardDescription>
            Automatically detect and rescue at-risk students in your Whop courses.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3">
          <p className="text-center text-[13px] text-[var(--ink-secondary)]">
            Let&apos;s set up RescueLoop for your Whop company. This takes about
            5 minutes.
          </p>
          <Button size="lg" className="gap-2" onClick={() => setStarted(true)}>
            <ShieldCheck className="size-4" />
            Start setup
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
