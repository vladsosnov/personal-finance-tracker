"use client";

import { Button, Container, Text, Title } from "@mantine/core";

const GlobalError = ({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) => {
  return (
    <Container size="sm" py="xl" style={{ textAlign: "center" }}>
      <Title order={2} mb="md">
        Something went wrong
      </Title>
      <Text c="dimmed" mb="lg">
        {process.env.NODE_ENV === "development" ? error.message : "An unexpected error occurred. Please try again later."}
      </Text>
      <Button onClick={reset}>Try again</Button>
    </Container>
  );
};

export default GlobalError;
