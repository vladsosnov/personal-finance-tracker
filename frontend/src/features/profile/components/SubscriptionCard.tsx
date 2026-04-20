import { Badge, Button, Card, Group, SimpleGrid, Stack, Table, Text, Title } from "@mantine/core";
import { PLANS } from "@/shared/constants/plans";
import anim from "@/shared/styles/page-animations.module.css";

type SubscriptionCardProps = {
  currentSubscription: string;
  billingState: "idle" | "checkout" | "portal";
  activeCheckoutPlan?: "PRO" | "LIFETIME" | null;
  canManageBilling?: boolean;
  onCheckout: (plan: "PRO" | "LIFETIME") => void;
  onManageBilling: () => void;
};

export const SubscriptionCard = ({
  currentSubscription,
  billingState,
  activeCheckoutPlan = null,
  canManageBilling = false,
  onCheckout,
  onManageBilling,
}: SubscriptionCardProps) => (
  <Card withBorder radius="md" p="lg">
    <Stack gap="md">
      <Stack gap={2}>
        <Title order={4}>Subscription</Title>
        <Text c="dimmed">Review your current plan and see available upgrade options.</Text>
      </Stack>
      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="sm">
        {PLANS.map((plan) => {
          const isCurrentPlan = currentSubscription.toLowerCase() === plan.name.toLowerCase();
          const isHighlightedPlan = plan.name === "Lifetime";
          return (
            <Card
              key={plan.name}
              withBorder
              radius="md"
              p="md"
              className={`${anim.hoverLift} ${isCurrentPlan ? anim.planCardCurrent : ""}`}
              aria-label={`${plan.name} plan${isCurrentPlan ? " (current)" : ""}`}
              aria-current={isCurrentPlan ? true : undefined}
              style={isHighlightedPlan ? { borderColor: "var(--mantine-color-teal-6)" } : undefined}
            >
              <Stack gap="sm">
                <Group justify="space-between" align="flex-start">
                  <Stack gap={2}>
                    <Title order={5}>{plan.name}</Title>
                    <Text fw={700}>{plan.price}</Text>
                  </Stack>
                  {isCurrentPlan ? (
                    <Badge color="teal">Current</Badge>
                  ) : isHighlightedPlan ? (
                    <Badge color="teal">Popular</Badge>
                  ) : plan.name === "Free" ? (
                    <Badge variant="light" color="gray">Available</Badge>
                  ) : null}
                </Group>
                <Text c="dimmed">{plan.description}</Text>
                <Table aria-label={`${plan.name} plan features`}>
                  <Table.Tbody>
                    {plan.features.map((feature) => (
                      <Table.Tr key={feature}>
                        <Table.Td py={6}>{feature}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
                {(plan.name === "Pro" || plan.name === "Lifetime") && !isCurrentPlan ? (
                  <Button fullWidth disabled variant={plan.name === "Pro" ? "light" : "filled"}>
                    Comming soon
                  </Button>
                ) : null}
                {plan.name === "Pro" && isCurrentPlan && canManageBilling ? (
                  <Button fullWidth variant="light" onClick={onManageBilling} loading={billingState === "portal"}>
                    Manage billing
                  </Button>
                ) : null}
              </Stack>
            </Card>
          );
        })}
      </SimpleGrid>
    </Stack>
  </Card>
);
