import type { ReactNode } from "react";
import { Button, Stack, Text, ThemeIcon, Title } from "@mantine/core";

type StateMessageProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
  iconColor?: string;
};

export const StateMessage = ({ title, description, actionLabel, onAction, icon, iconColor = "teal" }: StateMessageProps) => {
  return (
    <Stack gap={8} align="center" justify="center" ta="center" py="sm">
      {icon && (
        <ThemeIcon size={48} radius="xl" variant="light" color={iconColor}>
          {icon}
        </ThemeIcon>
      )}
      <Title order={5}>{title}</Title>
      <Text c="dimmed" size="sm">{description}</Text>
      {actionLabel && onAction ? (
        <Button variant="light" onClick={onAction} mt={4}>
          {actionLabel}
        </Button>
      ) : null}
    </Stack>
  );
};
