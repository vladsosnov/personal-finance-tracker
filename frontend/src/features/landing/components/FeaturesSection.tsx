import { Card, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { FEATURES } from "@/features/landing/constants/landingData";

export const FeaturesSection = () => (
  <section aria-labelledby="features-heading">
    <Stack gap="md">
      <Stack gap={4}>
        <Text fw={700}>What&#39;s already inside</Text>
        <Title order={2} id="features-heading">The home page now reflects real product value</Title>
      </Stack>
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        {FEATURES.map((feature) => (
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
