import { FloatingNav } from "@/components/marketing/floating-nav";
import { RescueHero } from "@/components/marketing/hero/rescue-hero";
import { TrustStrip } from "@/components/marketing/trust-strip";
import { HeroPreview } from "@/components/marketing/hero-preview";
import { OutcomeStrip } from "@/components/marketing/outcome-strip";
import { FeatureRows } from "@/components/marketing/feature-rows";
import { RevenueLeakageSection } from "@/components/marketing/revenue-leakage-section";
import { RecoveryProcessSection } from "@/components/marketing/process/recovery-process-section";
import { WorkflowShowcase } from "@/components/marketing/workflow-showcase";
import { CourseIntelligenceSection } from "@/components/marketing/course-intelligence";
import { SafetySection } from "@/components/marketing/safety-section";
import { RoiCalculator } from "@/components/marketing/roi-calculator";
import { PricingSection } from "@/components/marketing/pricing-section";
import { FaqSection } from "@/components/marketing/faq-section";
import { FinalCta } from "@/components/marketing/final-cta";
import { ClosingCta } from "@/components/marketing/closing-cta";
import { MarketingFooter } from "@/components/marketing/footer";

export default function MarketingPage() {
  return (
    <main className="flex min-h-screen flex-col bg-[var(--canvas)]">
      <FloatingNav />
      <div className="flex-1">
        <RescueHero />
        <TrustStrip />
        <HeroPreview />
        <OutcomeStrip />
        <FeatureRows />
        <RevenueLeakageSection />
        <RecoveryProcessSection />
        <WorkflowShowcase />
        <CourseIntelligenceSection />
        <SafetySection />
        <RoiCalculator />
        <PricingSection />
        <FaqSection />
        <FinalCta />
        <ClosingCta />
      </div>
      <MarketingFooter />
    </main>
  );
}
