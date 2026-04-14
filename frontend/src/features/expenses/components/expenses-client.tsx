"use client";

import { useQuery } from "@apollo/client/react";
import { Badge, Card, List, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import { IconCash, IconChartPie, IconClockHour4, IconLock, IconTag } from "@tabler/icons-react";
import { PageContainer } from "@/shared/components/page-container";
import { GET_ME, type MeQueryData } from "@/shared/gql/queries";
import anim from "@/shared/styles/page-animations.module.css";

export const ExpensesClient = () => {
  const { data, loading } = useQuery<MeQueryData>(GET_ME);
  const plan = data?.me?.plan ?? "free";
  const isFreePlan = plan === "free";

  if (loading) {
    return null;
  }

  return (
    <PageContainer>
      <Stack gap="xl" className={anim.pageEnter}>
        <Stack gap="xs" className={anim.stagger1}>
          <Title order={2}>Expenses</Title>
          <Text c="dimmed">
            Track where your money goes. Log purchases, categorize spending, and get a clear picture of your habits - so you can make smarter financial decisions.
          </Text>
        </Stack>

        {isFreePlan ? (
          <Card withBorder radius="md" p="xl" ta="center" className={anim.stagger2}>
            <Stack gap="sm" align="center">
              <ThemeIcon size={64} radius="xl" color="gray" variant="light">
                <IconLock size={32} />
              </ThemeIcon>
              <Badge size="lg" variant="light" color="gray">Paid Feature</Badge>
              <Text fw={600}>Expenses is available only for Pro or Lifetime.</Text>
              <Text c="dimmed" size="sm" maw={420}>
                Upgrade your plan to unlock expense tracking and access this page.
              </Text>
            </Stack>
          </Card>
        ) : (
          <>
            <Card withBorder radius="md" p="lg" className={anim.stagger2}>
              <Stack gap="md">
                <Title order={4}>What you&apos;ll be able to do</Title>
                <List spacing="sm" center>
                  <List.Item
                    icon={<ThemeIcon color="teal" variant="light" radius="xl" size={28}><IconCash size={16} /></ThemeIcon>}
                  >
                    <Text size="sm">Log expenses instantly - amount, date, and a quick note</Text>
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
                  This feature is currently in development. Stay tuned - expense tracking is coming in a future update.
                </Text>
              </Stack>
            </Card>
          </>
        )}
      </Stack>
    </PageContainer>
  );
};
