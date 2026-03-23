"use client";

import Link from "next/link";
import { Badge, Button, Card, Container, Group, List, SimpleGrid, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import { SignInCta } from "@/features/auth/components/sign-in-cta";
import { APP_ROUTES } from "@/shared/constants/routes";

const features = [
  {
    title: "Track progress with operations",
    description: "Add increases and decreases with your own date, edit them later, and keep the history clean.",
  },
  {
    title: "Understand progress over time",
    description: "Review charts, trend direction, filters, and completion pace instead of guessing from one balance.",
  },
  {
    title: "Import existing savings history",
    description: "Bring progress from a .txt export, preview what will be imported, and keep control over skipped items.",
  },
  {
    title: "Work the way you prefer",
    description: "Choose light, dark, or system theme, reorder goals, manage completed goals, and keep the dashboard focused.",
  },
];

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "For getting started with your first financial goal.",
    features: ["Goal tracking", "Operations log", "Theme settings"],
    cta: "Start free",
    href: APP_ROUTES.auth,
  },
  {
    name: "Pro",
    price: "$3/mo",
    description: "For users managing multiple goals with deeper tracking.",
    features: ["Everything in Free", "Advanced analytics", "More customization"],
    cta: "Coming soon",
    href: APP_ROUTES.auth,
    highlight: true,
  },
  {
    name: "Lifetime",
    price: "$9 once",
    description: "One-time payment for long-term planning without subscription.",
    features: ["Everything in Pro", "Permanent access"],
    cta: "Coming soon",
    href: APP_ROUTES.auth,
  },
];

const LandingPage = () => {
  return (
    <Container size="xl" py={56}>
      <Stack gap={48}>
        <Stack gap="xs" ta="center" maw={820} mx="auto">
          <Badge variant="light" size="lg" mx="auto">
            Financial Goals Tracker
          </Badge>
          <Title order={1}>Turn savings goals into a system you can actually follow</Title>
          <Text c="dimmed" maw={720} mx="auto">
            Create goals, log real operations, review progress over time, import existing history, and move completed goals out of the
            way without losing the record.
          </Text>
          <SignInCta />
        </Stack>

        <Card withBorder radius="lg" p="xl">
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl" verticalSpacing="xl">
            <Stack gap="md">
              <Stack gap={6}>
                <Text fw={700}>Product preview</Text>
                <Title order={2}>Built for real goal tracking, not just static target numbers</Title>
                <Text c="dimmed">
                  This section is ready for your dashboard screenshot. Until then, it highlights the exact workflows already available in
                  the product.
                </Text>
              </Stack>
              <List
                spacing="sm"
                icon={
                  <ThemeIcon size={20} radius="xl" variant="light">
                    •
                  </ThemeIcon>
                }
              >
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

            <Card withBorder radius="md" p="lg" bg="var(--mantine-color-body)">
              <Stack gap="md">
                <Group justify="space-between" align="flex-start">
                  <Stack gap={2}>
                    <Text fw={700}>Dashboard snapshot</Text>
                    <Text size="sm" c="dimmed">
                      Replace this card with a real screenshot when ready.
                    </Text>
                  </Stack>
                  <Badge variant="light">Live product features</Badge>
                </Group>

                <SimpleGrid cols={2} spacing="sm">
                  <Card withBorder radius="md" p="md">
                    <Stack gap={4}>
                      <Text size="sm" c="dimmed">
                        Active goals
                      </Text>
                      <Title order={3}>4</Title>
                    </Stack>
                  </Card>
                  <Card withBorder radius="md" p="md">
                    <Stack gap={4}>
                      <Text size="sm" c="dimmed">
                        Completed
                      </Text>
                      <Title order={3}>2</Title>
                    </Stack>
                  </Card>
                </SimpleGrid>

                <Card withBorder radius="md" p="md">
                  <Stack gap="xs">
                    <Group justify="space-between">
                      <Text fw={600}>Emergency fund</Text>
                      <Badge variant="light" color="teal">
                        68.0%
                      </Badge>
                    </Group>
                    <Text size="sm" c="dimmed">
                      $6,800 / $10,000
                    </Text>
                    <div
                      style={{
                        height: 10,
                        borderRadius: 999,
                        background: "rgba(15, 118, 110, 0.16)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: "68%",
                          height: "100%",
                          borderRadius: 999,
                          background: "#0F766E",
                        }}
                      />
                    </div>
                  </Stack>
                </Card>

                <Card withBorder radius="md" p="md">
                  <Stack gap="xs">
                    <Group justify="space-between">
                      <Text fw={600}>Recent activity</Text>
                      <Text size="sm" c="dimmed">
                        10 per page
                      </Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm">Salary transfer</Text>
                      <Text size="sm" c="teal">
                        +$500
                      </Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm">Unexpected expense</Text>
                      <Text size="sm" c="red">
                        -$80
                      </Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm">Monthly top-up</Text>
                      <Text size="sm" c="teal">
                        +$250
                      </Text>
                    </Group>
                  </Stack>
                </Card>
              </Stack>
            </Card>
          </SimpleGrid>
        </Card>

        <Stack gap="md">
          <Group justify="space-between" align="flex-end">
            <Stack gap={4}>
              <Text fw={700}>What’s already inside</Text>
              <Title order={2}>The home page now reflects real product value</Title>
            </Stack>
          </Group>
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            {features.map((feature) => (
              <Card key={feature.title} withBorder radius="md" p="lg">
                <Stack gap="xs">
                  <Title order={4}>{feature.title}</Title>
                  <Text c="dimmed">{feature.description}</Text>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        </Stack>

        <Stack gap="md">
          <Stack gap={4} ta="center">
            <Text fw={700}>Plans</Text>
            <Title order={2}>Choose the plan that fits your tracking needs</Title>
            <Text c="dimmed" maw={720} mx="auto">
              Free is available now. Paid plans are shown here so users can understand the product direction, while upgrade checkout is
              still coming later.
            </Text>
          </Stack>
          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                withBorder
                radius="md"
                p="lg"
                style={plan.highlight ? { borderColor: "var(--mantine-color-blue-6)" } : undefined}
              >
                <Stack gap="sm">
                  <Group justify="space-between" align="flex-start">
                    <Title order={3}>{plan.name}</Title>
                    {plan.highlight ? <Badge color="blue">Popular</Badge> : null}
                  </Group>
                  <Title order={2}>{plan.price}</Title>
                  <Text c="dimmed">{plan.description}</Text>
                  <List
                    spacing="xs"
                    icon={
                      <ThemeIcon size={20} radius="xl" variant="light">
                        •
                      </ThemeIcon>
                    }
                  >
                    {plan.features.map((feature) => (
                      <List.Item key={feature}>{feature}</List.Item>
                    ))}
                  </List>
                  <Button
                    component={Link}
                    href={plan.href}
                    variant={plan.highlight ? "filled" : "light"}
                    disabled={plan.cta === "Coming soon"}
                  >
                    {plan.cta}
                  </Button>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        </Stack>

        <Card withBorder radius="lg" p="xl">
          <Stack gap="sm" ta="center" maw={720} mx="auto">
            <Title order={2}>Start tracking with Financial Goals Tracker</Title>
            <Text c="dimmed">
              If you are already signed in, go straight back to your dashboard. If not, create an account and start with your first
              goal.
            </Text>
            <SignInCta />
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
};

export default LandingPage;
