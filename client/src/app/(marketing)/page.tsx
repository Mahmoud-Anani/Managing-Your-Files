import { Hero } from "@/components/features/home/hero";
import { FeatureGrid } from "@/components/features/home/feature-grid";
import { ProductSwiper } from "@/components/features/home/product-swiper";
import { HowItWorks } from "@/components/features/home/how-it-works";
import { CtaSection } from "@/components/features/home/cta-section";

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeatureGrid />
      <ProductSwiper />
      <HowItWorks />
      <CtaSection />
    </>
  );
}
