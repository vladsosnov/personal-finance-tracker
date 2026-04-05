"use client";

import Link from "next/link";
import { Badge, Button, Card, Group, List, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { ListBullet } from "@/features/landing/components/ListBullet";
import { AnimateOnScroll } from "@/features/landing/components/AnimateOnScroll";
import { AnimatedCounter } from "@/features/landing/components/AnimatedCounter";
import { APP_ROUTES } from "@/shared/constants/routes";
import styles from "@/features/landing/styles/landing.module.css";

export const ProductPreviewSection = () => (
  <section aria-labelledby="product-preview-heading">
    <AnimateOnScroll variant="scale">
      <Card withBorder radius="lg" p={{ base: "md", sm: "xl" }} className={styles.previewCard}>
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl" verticalSpacing="xl">
          <Stack gap="md">
            <Stack gap={6}>
              <Text fw={700}>Product preview</Text>
              <Title order={2} id="product-preview-heading">Built for real goal tracking, not just static target numbers</Title>
              <Text c="dimmed">
                This section is ready for your dashboard screenshot. Until then, it highlights the exact workflows
                already available in the product.
              </Text>
            </Stack>
            <List spacing="sm" icon={ListBullet}>
              <List.Item>Goal cards with drag and drop ordering</List.Item>
              <List.Item>Operations log with edit, delete, and pagination</List.Item>
              <List.Item>Progress chart with filters and forecast</List.Item>
              <List.Item>Import flow, profile settings, and completed goals</List.Item>
            </List>
            <Group>
              <Button component={Link} href={APP_ROUTES.dashboard}>
                View dashboard
              </Button>
              <Button component={Link} href={APP_ROUTES.profile} variant="light">
                View profile
              </Button>
            </Group>
          </Stack>

          <DashboardSnapshot />
        </SimpleGrid>
      </Card>
    </AnimateOnScroll>
  </section>
);

const DashboardSnapshot = () => (
  <Card withBorder radius="md" p="lg" bg="var(--mantine-color-body)" aria-label="Dashboard preview example">
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <Stack gap={2}>
          <Text fw={700}>Dashboard snapshot</Text>
          <Text size="sm" c="dimmed">Replace this card with a real screenshot when ready.</Text>
        </Stack>
        <Badge variant="light">Live product features</Badge>
      </Group>

      <SimpleGrid cols={2} spacing="sm">
        <AnimateOnScroll delay={100}>
          <Card withBorder radius="md" p="md">
            <Stack gap={4}>
              <Text size="sm" c="dimmed">Active goals</Text>
              <AnimatedCounter target={4} />
            </Stack>
          </Card>
        </AnimateOnScroll>
        <AnimateOnScroll delay={200}>
          <Card withBorder radius="md" p="md">
            <Stack gap={4}>
              <Text size="sm" c="dimmed">Completed</Text>
              <AnimatedCounter target={2} />
            </Stack>
          </Card>
        </AnimateOnScroll>
      </SimpleGrid>

      <AnimateOnScroll delay={300}>
        <Card withBorder radius="md" p="md">
          <Stack gap="xs">
            <Group justify="space-between">
              <Text fw={600}>Emergency fund</Text>
              <Badge variant="light" color="teal">68.0%</Badge>
            </Group>
            <Text size="sm" c="dimmed">$6,800 / $10,000</Text>
            <div
              role="progressbar"
              aria-valuenow={68}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Emergency fund progress: 68%"
              style={{ height: 10, borderRadius: 999, background: "rgba(15, 118, 110, 0.16)", overflow: "hidden" }}
            >
              <div
                className={styles.animatedProgress}
                style={{ width: "68%", height: "100%", borderRadius: 999, background: "#0F766E" }}
              />
            </div>
          </Stack>
        </Card>
      </AnimateOnScroll>

      <AnimateOnScroll delay={400}>
        <Card withBorder radius="md" p="md">
          <Stack gap="xs">
            <Group justify="space-between">
              <Text fw={600}>Recent activity</Text>
              <Text size="sm" c="dimmed">10 per page</Text>
            </Group>
            {[
              { label: "Salary transfer", amount: "+$500", color: "teal" },
              { label: "Unexpected expense", amount: "-$80", color: "red" },
              { label: "Monthly top-up", amount: "+$250", color: "teal" },
            ].map(({ label, amount, color }) => (
              <Group key={label} justify="space-between">
                <Text size="sm">{label}</Text>
                <Text size="sm" c={color}>{amount}</Text>
              </Group>
            ))}
          </Stack>
        </Card>
      </AnimateOnScroll>
    </Stack>
  </Card>
);
