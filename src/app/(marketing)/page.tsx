import { FloatingNav } from "@/components/marketing/floating-nav";
import { MarketingHero } from "@/components/marketing/hero";
import { OutcomeStrip } from "@/components/marketing/outcome-strip";
import { RevenueLeakageSection } from "@/components/marketing/revenue-leakage-section";
import { ProcessSection } from "@/components/marketing/process-section";
import { WorkflowShowcase } from "@/components/marketing/workflow-showcase";
import { CourseIntelligenceSection } from "@/components/marketing/course-intelligence";
import { SafetySection } from "@/components/marketing/safety-section";
import { RoiCalculator } from "@/components/marketing/roi-calculator";
import { PricingSection } from "@/components/marketing/pricing-section";
import { FaqSection } from "@/components/marketing/faq-section";
import { FinalCta } from "@/components/marketing/final-cta";
import { MarketingFooter } from "@/components/marketing/footer";

export default function MarketingPage() {
  return (
    <main className="bg-[var(--canvas)]">
      <FloatingNav />
      <MarketingHero />
      <OutcomeStrip />
      <RevenueLeakageSection />
      <ProcessSection />
      <WorkflowShowcase />
      <CourseIntelligenceSection />
      <SafetySection />
      <RoiCalculator />
      <PricingSection />
      <FaqSection />
      <FinalCta />
      <MarketingFooter />
    </main>
  );
}
