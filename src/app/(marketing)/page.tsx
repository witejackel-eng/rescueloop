import { FloatingNav } from "@/components/marketing/floating-nav";
import { RescueHero } from "@/components/marketing/hero/rescue-hero";
import { FeatureRows } from "@/components/marketing/feature-rows";
import { RecoveryProcessSection } from "@/components/marketing/process/recovery-process-section";
import { WorkflowShowcase } from "@/components/marketing/workflow-showcase";
import { SafetySection } from "@/components/marketing/safety-section";
import { CourseIntelligenceSection } from "@/components/marketing/course-intelligence";
import { OutcomeStrip } from "@/components/marketing/outcome-strip";
import { RoiCalculator } from "@/components/marketing/roi-calculator";
import { PricingSection } from "@/components/marketing/pricing-section";
import { FaqSection } from "@/components/marketing/faq-section";
import { FinalCta } from "@/components/marketing/final-cta";
import { MarketingFooter } from "@/components/marketing/footer";

export default function MarketingPage() {
  return (
    <main className="bg-[var(--canvas)]">
      <FloatingNav />
      <RescueHero />
      <FeatureRows />
      <RecoveryProcessSection />
      <WorkflowShowcase />
      <SafetySection />
      <CourseIntelligenceSection />
      <OutcomeStrip />
      <RoiCalculator />
      <PricingSection />
      <FaqSection />
      <FinalCta />
      <MarketingFooter />
    </main>
  );
}
