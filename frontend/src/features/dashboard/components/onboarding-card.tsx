"use client";

import { Button, Card, Stack, Text, Title, ThemeIcon, Group } from "@mantine/core";
import { IconRocket, IconTargetArrow } from "@tabler/icons-react";

type OnboardingCardProps = {
  onCreateExample: () => void;
  onCreateCustom: () => void;
  isCreating: boolean;
};

export const OnboardingCard = ({ onCreateExample, onCreateCustom, isCreating }: OnboardingCardProps) => (
  <Card withBorder radius="md" p="xl">
    <Stack align="center" gap="lg">
      <ThemeIcon size={56} radius="xl" variant="light" color="teal">
        <IconRocket size={28} />
      </ThemeIcon>
      <Stack align="center" gap="xs">
        <Title order={3} ta="center">Welcome! Let&apos;s set your first goal</Title>
        <Text c="dimmed" ta="center" maw={400}>
          Track your savings progress visually. Start with an example goal or create your own.
        </Text>
      </Stack>
      <Group gap="md">
        <Button
          leftSection={<IconTargetArrow size={16} />}
          onClick={onCreateExample}
          loading={isCreating}
        >
          Quick start: Emergency Fund
        </Button>
        <Button variant="light" onClick={onCreateCustom}>
          Create custom goal
        </Button>
      </Group>
    </Stack>
  </Card>
);
