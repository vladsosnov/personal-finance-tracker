"use client";

import { Badge, Card, List, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import { IconCash, IconChartPie, IconClockHour4, IconTag } from "@tabler/icons-react";
import { PageContainer } from "@/shared/components/page-container";
import anim from "@/shared/styles/page-animations.module.css";

export const ExpensesClient = () => (
  <PageContainer>
    <Stack gap="xl" className={anim.pageEnter}>
      <Stack gap="xs" className={anim.stagger1}>
        <Title order={2}>Expenses</Title>
        <Text c="dimmed">
          Track where your money goes. Log purchases, categorize spending, and get a clear picture of your habits — so you can make smarter financial decisions.
        </Text>
      </Stack>

      <Card withBorder radius="md" p="lg" className={anim.stagger2}>
        <Stack gap="md">
          <Title order={4}>What&apos;s coming</Title>
          <List spacing="sm" center>
            <List.Item
              icon={<ThemeIcon color="teal" variant="light" radius="xl" size={28}><IconCash size={16} /></ThemeIcon>}
            >
              <Text size="sm">Log expenses instantly — amount, date, and a quick note</Text>
            </List.Item>
            <List.Item
              icon={<ThemeIcon color="teal" variant="light" radius="xl" size={28}><IconTag size={16} /></ThemeIcon>}
            >
              <Text size="sm">Organize by category: food, transport, subscriptions, and more</Text>
            </List.Item>
            <List.Item
              icon={<ThemeIcon color="teal" variant="light" radius="xl" size={28}><IconChartPie size={16} /></ThemeIcon>}
            >
              <Text size="sm">See spending breakdowns with charts to spot patterns over time</Text>
            </List.Item>
            <List.Item
              icon={<ThemeIcon color="teal" variant="light" radius="xl" size={28}><IconClockHour4 size={16} /></ThemeIcon>}
            >
              <Text size="sm">Browse your full history and filter by date or category</Text>
            </List.Item>
          </List>
        </Stack>
      </Card>

      <Card withBorder radius="md" p="xl" ta="center" className={anim.stagger3}>
        <Stack gap="sm" align="center">
          <Badge size="xl" variant="light" color="orange" radius="md" px="lg" py="sm">
            Coming Soon
          </Badge>
          <Text c="dimmed" size="sm" maw={400}>
            Expense tracking is a paid feature included in Pro and Lifetime plans. It&apos;s currently in development and will be available in a future update.
          </Text>
        </Stack>
      </Card>
    </Stack>
  </PageContainer>
);
