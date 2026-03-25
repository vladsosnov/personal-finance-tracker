import { Badge, Card, Group, SimpleGrid, Stack, Table, Text, Title } from "@mantine/core";
import { SUBSCRIPTION_PLANS } from "@/features/profile/constants/subscriptionPlans";

type SubscriptionCardProps = {
  currentSubscription: string;
};

export const SubscriptionCard = ({ currentSubscription }: SubscriptionCardProps) => (
  <Card withBorder radius="md" p="lg">
    <Stack gap="md">
      <Stack gap={2}>
        <Title order={4}>Subscription</Title>
        <Text c="dimmed">Review your current plan and see available upgrade options.</Text>
      </Stack>
      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="sm">
        {SUBSCRIPTION_PLANS.map((plan) => {
          const isCurrentPlan = currentSubscription.toLowerCase() === plan.name.toLowerCase();
          return (
            <Card
              key={plan.name}
              withBorder
              radius="md"
              p="md"
              aria-label={`${plan.name} plan${isCurrentPlan ? " (current)" : ""}`}
              aria-current={isCurrentPlan ? true : undefined}
            >
              <Stack gap="sm">
                <Group justify="space-between" align="flex-start">
                  <Stack gap={2}>
                    <Title order={5}>{plan.name}</Title>
                    <Text fw={700}>{plan.price}</Text>
                  </Stack>
                  {isCurrentPlan ? <Badge color="teal">Current</Badge> : <Badge variant="light">Soon</Badge>}
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
              </Stack>
            </Card>
          );
        })}
      </SimpleGrid>
    </Stack>
  </Card>
);
