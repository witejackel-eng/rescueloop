import { FloatingNav } from "@/components/marketing/floating-nav";
import { RescueHero } from "@/components/marketing/hero/rescue-hero";
import { FeatureRows } from "@/components/marketing/feature-rows";
import { RecoveryProcessSection } from "@/components/marketing/process/recovery-process-section";
import { RescueQueueMoment } from "@/components/marketing/product-moments/rescue-queue-moment";
import { PlaybookMoment } from "@/components/marketing/product-moments/playbook-moment";
import { CourseIntelligenceMoment } from "@/components/marketing/product-moments/course-intelligence-moment";
import { SafetySection } from "@/components/marketing/safety-section";
import { OutcomeStrip } from "@/components/marketing/outcome-strip";
import { RoiCalculator } from "@/components/marketing/roi-calculator";
import { PricingSection } from "@/components/marketing/pricing-section";
import { FaqSection } from "@/components/marketing/faq-section";
import { FinalCta } from "@/components/marketing/final-cta";
import { MarketingFooter } from "@/components/marketing/footer";

export default function MarketingPage() {
  return (
    <main className="bg-[var(--canvas)]">
      {/* Hero — warm canvas */}
      <FloatingNav />
      <RescueHero />

      {/* Product intro — warm canvas */}
      <FeatureRows />

      {/* How it works — dark ink */}
      <RecoveryProcessSection />

      {/* Rescue Queue showcase — white / elevated surface */}
      <RescueQueueMoment />

      {/* Playbook / rule simulation — very pale recovery green canvas */}
      <PlaybookMoment />

      {/* Course Intelligence — white surface */}
      <CourseIntelligenceMoment />

      {/* Safety — warm canvas */}
      <SafetySection />

      {/* Evidence / Value — secondary cream */}
      <OutcomeStrip />

      {/* ROI Calculator — light neutral */}
      <RoiCalculator />

      {/* Pricing — warm canvas */}
      <PricingSection />

      {/* FAQ — secondary cream */}
      <FaqSection />

      {/* Final CTA — recovery-tinted dark treatment */}
      <FinalCta />

      <MarketingFooter />
    </main>
  );
}
