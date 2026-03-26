"use client";

import Link from "next/link";
import { Badge, Button, Card, Group, List, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { ListBullet } from "@/features/landing/components/ListBullet";
import { AnimateOnScroll } from "@/features/landing/components/AnimateOnScroll";
import { LANDING_PLANS } from "@/features/landing/constants/landingData";
import styles from "@/features/landing/styles/landing.module.css";

export const PlansSection = () => (
  <section aria-labelledby="plans-heading">
    <Stack gap="md">
      <AnimateOnScroll>
        <Stack gap={4} ta="center">
          <Text fw={700}>Plans</Text>
          <Title order={2} id="plans-heading">Choose the plan that fits your tracking needs</Title>
          <Text c="dimmed" maw={720} mx="auto">
            Free is available now. Paid plans are shown here so users can understand the product direction, while upgrade
            checkout is still coming later.
          </Text>
          <div className={styles.sectionDivider} style={{ marginTop: 8 }} />
        </Stack>
      </AnimateOnScroll>
      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
        {LANDING_PLANS.map((plan, i) => (
          <AnimateOnScroll key={plan.name} delay={i * 120}>
            <Card
              withBorder
              radius="md"
              p="lg"
              className={`${styles.planCard} ${plan.highlight ? styles.planCardHighlight : ""}`}
              style={plan.highlight ? { borderColor: "var(--mantine-color-teal-6)" } : undefined}
              h="100%"
            >
              <Stack gap="sm">
                <Group justify="space-between" align="flex-start">
                  <Title order={3}>{plan.name}</Title>
                  {plan.highlight ? <Badge color="teal">Popular</Badge> : null}
                </Group>
                <Title order={2}>{plan.price}</Title>
                <Text c="dimmed">{plan.description}</Text>
                <List spacing="xs" icon={ListBullet}>
                  {plan.features.map((feature) => (
                    <List.Item key={feature}>{feature}</List.Item>
                  ))}
                </List>
                {plan.cta === "Coming soon" ? (
                  <Button
                    variant={plan.highlight ? "filled" : "light"}
                    disabled
                    aria-label={`${plan.name} plan — coming soon`}
                  >
                    {plan.cta}
                  </Button>
                ) : (
                  <Button
                    component={Link}
                    href={plan.href}
                    variant={plan.highlight ? "filled" : "light"}
                    aria-label={`${plan.cta} with ${plan.name} plan`}
                  >
                    {plan.cta}
                  </Button>
                )}
              </Stack>
            </Card>
          </AnimateOnScroll>
        ))}
      </SimpleGrid>
    </Stack>
  </section>
);
