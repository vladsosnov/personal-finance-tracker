"use client";

import { Button, Container, Text, Title } from "@mantine/core";

export const GlobalError = ({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) => {
  return (
    <Container size="sm" py="xl" style={{ textAlign: "center" }}>
      <Title order={2} mb="md">
        Something went wrong
      </Title>
      <Text c="dimmed" mb="lg">
        {error.message || "An unexpected error occurred."}
      </Text>
      <Button onClick={reset}>Try again</Button>
    </Container>
  );
};
