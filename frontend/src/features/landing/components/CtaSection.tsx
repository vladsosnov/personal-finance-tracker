"use client";

import { Card, Stack, Text, Title } from "@mantine/core";
import { SignInCta } from "@/features/auth/components/sign-in-cta";
import { AnimateOnScroll } from "@/features/landing/components/AnimateOnScroll";
import styles from "@/features/landing/styles/landing.module.css";

export const CtaSection = () => (
  <section aria-labelledby="cta-heading">
    <AnimateOnScroll variant="scale">
      <Card withBorder radius="lg" p={{ base: "md", sm: "xl" }} className={styles.ctaCard}>
        <div className={styles.ctaGlow} />
        <Stack gap="sm" ta="center" maw={720} mx="auto" style={{ position: "relative", zIndex: 1 }}>
          <Title order={2} id="cta-heading">Start tracking with Financial Goals Tracker</Title>
          <Text c="dimmed">
            If you are already signed in, go straight back to your dashboard. If not, create an account and start with
            your first goal.
          </Text>
          <SignInCta />
        </Stack>
      </Card>
    </AnimateOnScroll>
  </section>
);
