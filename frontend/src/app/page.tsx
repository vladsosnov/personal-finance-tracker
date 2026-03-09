import { Button, Card, Container, Group, Stack, Text, Title } from "@mantine/core";

export default function Home() {
  return (
    <Container py={64} size="sm">
      <Card withBorder radius="md" p="xl">
        <Stack gap="md">
          <Title order={1}>Personal Finance Tracker</Title>
          <Text c="dimmed">
            Next.js + TypeScript frontend is now wired with Mantine. Next step is connecting GraphQL + Zustand.
          </Text>
          <Group>
            <Button>Start Building</Button>
          </Group>
        </Stack>
      </Card>
    </Container>
  );
}
