import { Container, Text } from "@mantine/core";

export const Footer = () => {
  return (
    <footer className="app-footer">
      <Container size="lg" py="md">
        <Text size="sm" c="dimmed" ta="center">
          Financial Goals Tracker. Build goals, update progress, stay accountable.
        </Text>
      </Container>
    </footer>
  );
};
