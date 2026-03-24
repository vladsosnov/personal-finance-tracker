"use client";

import { Container, Stack } from "@mantine/core";
import { CtaSection } from "@/features/landing/components/CtaSection";
import { FeaturesSection } from "@/features/landing/components/FeaturesSection";
import { FutureFeaturesSection } from "@/features/landing/components/FutureFeaturesSection";
import { HeroSection } from "@/features/landing/components/HeroSection";
import { PlansSection } from "@/features/landing/components/PlansSection";
import { ProductPreviewSection } from "@/features/landing/components/ProductPreviewSection";

const LandingPage = () => (
  <Container size="xl" py={24}>
    <Stack gap={48}>
      <HeroSection />
      <ProductPreviewSection />
      <FeaturesSection />
      <FutureFeaturesSection />
      <PlansSection />
      <CtaSection />
    </Stack>
  </Container>
);

export default LandingPage;
