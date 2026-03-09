import Link from "next/link";
import { Badge, Button, Card, Container, Group, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { SignInCta } from "@/features/auth/components/sign-in-cta";
import { APP_ROUTES } from "@/shared/constants/routes";

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "For getting started with your first financial goal.",
    features: ["1 active goal", "Basic progress tracking", "Web dashboard access"],
    cta: "Start free",
    href: APP_ROUTES.auth,
  },
  {
    name: "Pro",
    price: "$12/mo",
    description: "For users managing multiple goals with deeper tracking.",
    features: ["Unlimited goals", "Priority support", "Advanced analytics"],
    cta: "Go pro",
    href: APP_ROUTES.auth,
    highlight: true,
  },
  {
    name: "Lifetime",
    price: "$249 once",
    description: "One-time payment for long-term planning without subscription.",
    features: ["Everything in Pro", "All future core updates", "Founder badge"],
    cta: "Get lifetime",
    href: APP_ROUTES.auth,
  },
];

const LandingPage = () => {
  return (
    <Container size="lg" py={56}>
      <Stack gap="xl">
        <Stack gap="xs" ta="center">
          <Badge variant="light" size="lg" mx="auto">
            Financial Goals Tracker
          </Badge>
          <Title order={1}>Plan your money goals and track progress with confidence</Title>
          <Text c="dimmed" maw={720} mx="auto">
            Create clear targets like buying a house, update progress with operations, and review your budget trend with charts.
          </Text>
          <SignInCta />
        </Stack>

        <SimpleGrid cols={{ base: 1, md: 3 }}>
          {plans.map((plan) => (
            <Card
              key={plan.name}
              withBorder
              radius="md"
              p="lg"
              style={plan.highlight ? { borderColor: "var(--mantine-color-blue-6)" } : undefined}
            >
              <Stack gap="sm">
                <Group justify="space-between">
                  <Title order={3}>{plan.name}</Title>
                  {plan.highlight ? <Badge color="blue">Popular</Badge> : null}
                </Group>
                <Title order={2}>{plan.price}</Title>
                <Text c="dimmed">{plan.description}</Text>
                <ul style={{ paddingLeft: 20, margin: 0 }}>
                  {plan.features.map((feature) => (
                    <li key={feature} style={{ marginBottom: 6 }}>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button component={Link} href={plan.href} variant={plan.highlight ? "filled" : "light"}>
                  {plan.cta}
                </Button>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      </Stack>
    </Container>
  );
};

export default LandingPage;
