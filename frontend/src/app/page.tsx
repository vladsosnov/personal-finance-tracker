"use client";

import { Stack } from "@mantine/core";
import { PageContainer } from "@/shared/components/page-container";
import { CtaSection } from "@/features/landing/components/CtaSection";
import { FeaturesSection } from "@/features/landing/components/FeaturesSection";
import { FutureFeaturesSection } from "@/features/landing/components/FutureFeaturesSection";
import { HeroSection } from "@/features/landing/components/HeroSection";
import { PlansSection } from "@/features/landing/components/PlansSection";
import { ProductPreviewSection } from "@/features/landing/components/ProductPreviewSection";

const LandingPage = () => (
  <PageContainer>
    <Stack gap={40} style={{ gap: "clamp(20px, 5vw, 40px)" }}>
      <HeroSection />
      <ProductPreviewSection />
      <FeaturesSection />
      <FutureFeaturesSection />
      <PlansSection />
      <CtaSection />
    </Stack>
  </PageContainer>
);

export default LandingPage;
