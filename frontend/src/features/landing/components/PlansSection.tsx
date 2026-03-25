import Link from "next/link";
import { Badge, Button, Card, Group, List, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { ListBullet } from "@/features/landing/components/ListBullet";
import { LANDING_PLANS } from "@/features/landing/constants/landingData";

export const PlansSection = () => (
  <section aria-labelledby="plans-heading">
    <Stack gap="md">
      <Stack gap={4} ta="center">
        <Text fw={700}>Plans</Text>
        <Title order={2} id="plans-heading">Choose the plan that fits your tracking needs</Title>
      <Text c="dimmed" maw={720} mx="auto">
        Free is available now. Paid plans are shown here so users can understand the product direction, while upgrade checkout is still
        coming later.
      </Text>
    </Stack>
    <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
      {LANDING_PLANS.map((plan) => (
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
            <List spacing="xs" icon={ListBullet}>
              {plan.features.map((feature) => (
                <List.Item key={feature}>{feature}</List.Item>
              ))}
            </List>
            {plan.cta === "Coming soon" ? (
              <Button variant={plan.highlight ? "filled" : "light"} disabled aria-label={`${plan.name} plan — coming soon`}>
                {plan.cta}
              </Button>
            ) : (
              <Button component={Link} href={plan.href} variant={plan.highlight ? "filled" : "light"} aria-label={`${plan.cta} with ${plan.name} plan`}>
                {plan.cta}
              </Button>
            )}
          </Stack>
        </Card>
      ))}
    </SimpleGrid>
  </Stack>
  </section>
);
