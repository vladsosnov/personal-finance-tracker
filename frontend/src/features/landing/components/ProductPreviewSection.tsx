"use client";

import Image from "next/image";
import Link from "next/link";
import { Button, Card, Group, List, SimpleGrid, Stack, Text, Title, useComputedColorScheme } from "@mantine/core";
import { ListBullet } from "@/features/landing/components/ListBullet";
import { AnimateOnScroll } from "@/features/landing/components/AnimateOnScroll";
import { APP_ROUTES } from "@/shared/constants/routes";
import styles from "@/features/landing/styles/landing.module.css";
import dashboardPreviewLight from "@/Pi7_Gif-light.gif";
import dashboardPreviewDark from "@/Pi7_Gif-dark.gif";

export const ProductPreviewSection = () => {
  const colorScheme = useComputedColorScheme("light", { getInitialValueInEffect: true });
  const dashboardPreview = colorScheme === "dark" ? dashboardPreviewDark : dashboardPreviewLight;

  return (
    <section aria-labelledby="product-preview-heading">
      <AnimateOnScroll variant="scale">
        <Card withBorder radius="lg" p={{ base: "md", sm: "xl" }} className={styles.previewCard}>
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl" verticalSpacing="xl">
            <Stack gap="md">
              <Stack gap={6}>
                <Text fw={700}>Product preview</Text>
                <Title order={2} id="product-preview-heading">Built for real goal tracking, not just static target numbers</Title>
                <Text c="dimmed">
                  See how the dashboard works in practice — create goals, log operations, and track progress over time.
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

            <AnimateOnScroll delay={200}>
              <Image
                src={dashboardPreview}
                alt="Dashboard demo showing goal creation, operations, and progress tracking"
                unoptimized
                style={{ width: "100%", height: "auto", borderRadius: "var(--mantine-radius-md)" }}
              />
            </AnimateOnScroll>
          </SimpleGrid>
        </Card>
      </AnimateOnScroll>
    </section>
  );
};
