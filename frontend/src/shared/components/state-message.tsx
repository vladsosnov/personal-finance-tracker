import { Button, Stack, Text, Title } from "@mantine/core";

type StateMessageProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export const StateMessage = ({ title, description, actionLabel, onAction }: StateMessageProps) => {
  return (
    <Stack gap={6} align="center" justify="center" ta="center">
      <Title order={5}>{title}</Title>
      <Text c="dimmed">{description}</Text>
      {actionLabel && onAction ? (
        <Button variant="light" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </Stack>
  );
};
