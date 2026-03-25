import { Card, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { FUTURE_FEATURES } from "@/features/landing/constants/landingData";

export const FutureFeaturesSection = () => (
  <section aria-labelledby="future-features-heading">
    <Stack gap="md">
      <Stack gap={4} ta="center">
        <Text fw={700}>Future features</Text>
        <Title order={2} id="future-features-heading">We are actively building what comes next</Title>
        <Text c="dimmed" maw={760} mx="auto">
          Financial Goals Tracker is not static. The roadmap already points toward budgeting, localization, recurring planning, and deeper
          personal finance workflows.
        </Text>
      </Stack>
      <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md">
        {FUTURE_FEATURES.map((feature) => (
          <Card key={feature.title} withBorder radius="md" p="lg">
            <Stack gap="xs">
              <Title order={4}>{feature.title}</Title>
              <Text c="dimmed">{feature.description}</Text>
            </Stack>
          </Card>
        ))}
      </SimpleGrid>
    </Stack>
  </section>
);
