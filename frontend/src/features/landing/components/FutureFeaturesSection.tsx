"use client";

import { useCallback, type MouseEvent } from "react";
import { Badge, Card, Group, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { IconCoin, IconLanguage, IconCalendarStats, IconRepeat, IconBell, IconMessageCircle } from "@tabler/icons-react";
import { AnimateOnScroll } from "@/features/landing/components/AnimateOnScroll";
import styles from "@/features/landing/styles/landing.module.css";

const FUTURE_FEATURES = [
  {
    icon: IconCoin,
    title: "Multi-currency goals",
    description: "Track goals in different currencies with clearer per-goal currency handling and stronger reporting.",
    completed: true,
  },
  {
    icon: IconLanguage,
    title: "Internationalization",
    description: "Localize dates, numbers, labels, and interface copy for users in different languages and regions.",
  },
  {
    icon: IconCalendarStats,
    title: "Monthly budget planning",
    description: "Plan recurring categories like rent, food, transport, savings, and compare plan versus actual.",
  },
  {
    icon: IconRepeat,
    title: "Recurring operations",
    description: "Automate repeating contributions like salary transfers, rent, subscriptions, and monthly savings.",
  },
  {
    icon: IconBell,
    title: "Goal reminders",
    description: "Get nudges for inactive goals, upcoming deadlines, and monthly saving targets.",
  },
  {
    icon: IconMessageCircle,
    title: "Community-driven roadmap",
    description: "Submit ideas, vote on what matters most, and shape the product together. We build what you ask for.",
  },
];

const FutureFeatureCard = ({ feature, index }: { feature: typeof FUTURE_FEATURES[number]; index: number }) => {
  const Icon = feature.icon;

  const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
  }, []);

  return (
    <AnimateOnScroll delay={index * 80}>
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
            <Group justify="space-between" align="flex-start">
              <div className={styles.featureIcon}>
                <Icon size={24} stroke={1.5} color={"completed" in feature && feature.completed ? "var(--mantine-color-teal-6)" : "#C36A4A"} />
              </div>
              {"completed" in feature && feature.completed && (
                <Badge variant="light" color="teal" size="sm">Completed</Badge>
              )}
            </Group>
            <Title order={4}>{feature.title}</Title>
            <Text c="dimmed">{feature.description}</Text>
          </Stack>
        </div>
      </Card>
    </AnimateOnScroll>
  );
};

export const FutureFeaturesSection = () => (
  <section aria-labelledby="future-features-heading">
    <Stack gap="md">
      <AnimateOnScroll>
        <Stack gap={4} ta="center">
          <Text fw={700}>Future features</Text>
          <Title order={2} id="future-features-heading">We are actively building what comes next</Title>
          <Text c="dimmed" maw={760} mx="auto">
            Financial Goals Tracker is not static. The roadmap already points toward budgeting, localization, recurring
            planning, and deeper personal finance workflows.
          </Text>
          <div className={styles.sectionDivider} style={{ marginTop: 8 }} />
        </Stack>
      </AnimateOnScroll>
      <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md">
        {FUTURE_FEATURES.map((feature, i) => (
          <FutureFeatureCard key={feature.title} feature={feature} index={i} />
        ))}
      </SimpleGrid>
    </Stack>
  </section>
);
