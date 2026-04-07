"use client";

import { useCallback, type MouseEvent } from "react";
import { Card, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { IconHistory, IconChartLine, IconFileImport, IconPalette, IconCoin } from "@tabler/icons-react";
import { AnimateOnScroll } from "@/features/landing/components/AnimateOnScroll";
import styles from "@/features/landing/styles/landing.module.css";

const FEATURES = [
  {
    icon: IconHistory,
    title: "Track progress with operations",
    description: "Add increases and decreases with your own date, edit them later, and keep the history clean.",
  },
  {
    icon: IconChartLine,
    title: "Understand progress over time",
    description: "Review charts, trend direction, filters, and completion pace instead of guessing from one balance.",
  },
  {
    icon: IconFileImport,
    title: "Import existing savings history",
    description: "Bring progress from a .txt export, preview what will be imported, and keep control over skipped items.",
  },
  {
    icon: IconCoin,
    title: "Multi-currency goals",
    description: "Track goals in different currencies with per-goal currency handling, automatic exchange rate conversion, and cross-currency operations.",
  },
  {
    icon: IconPalette,
    title: "Work the way you prefer",
    description: "Choose light, dark, or system theme, reorder goals, manage completed goals, and keep the dashboard focused.",
  },
];

const FeatureCard = ({ feature, index }: { feature: typeof FEATURES[number]; index: number }) => {
  const Icon = feature.icon;

  const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
  }, []);

  return (
    <AnimateOnScroll delay={index * 100}>
      <Card
        withBorder
        radius="md"
        p="lg"
        className={styles.featureCard}
        onMouseMove={handleMouseMove}
        h="100%"
      >
        <div className={styles.featureCardContent}>
          <Stack gap="xs">
            <div className={styles.featureIcon}>
              <Icon size={24} stroke={1.5} color="var(--mantine-color-teal-6)" />
            </div>
            <Title order={4}>{feature.title}</Title>
            <Text c="dimmed">{feature.description}</Text>
          </Stack>
        </div>
      </Card>
    </AnimateOnScroll>
  );
};

export const FeaturesSection = () => (
  <section aria-labelledby="features-heading">
    <Stack gap="md">
      <AnimateOnScroll>
        <Stack gap={4}>
          <Text fw={700} ta="center">What&#39;s already inside</Text>
          <Title order={2} id="features-heading" ta="center">
            The home page now reflects real product value
          </Title>
          <div className={styles.sectionDivider} style={{ marginTop: 8 }} />
        </Stack>
      </AnimateOnScroll>
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        {FEATURES.map((feature, i) => (
          <FeatureCard key={feature.title} feature={feature} index={i} />
        ))}
      </SimpleGrid>
    </Stack>
  </section>
);
