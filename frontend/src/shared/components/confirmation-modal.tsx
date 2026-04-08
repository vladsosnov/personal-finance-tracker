import type { ReactNode } from "react";
import { Button, Group, Modal, Stack, Text } from "@mantine/core";

export type ConfirmationModalProps = {
  opened: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  confirmColor?: string;
  cancelLabel?: string;
  isLoading: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export const ConfirmationModal = ({
  opened,
  title,
  description,
  confirmLabel,
  confirmColor = "red",
  cancelLabel = "Cancel",
  isLoading,
  onConfirm,
  onClose,
}: ConfirmationModalProps) => (
  <Modal opened={opened} onClose={() => { if (!isLoading) onClose(); }} title={title} centered>
    <Stack gap="md">
      <Text>{description}</Text>
      <Group justify="flex-end">
        <Button variant="default" onClick={onClose} disabled={isLoading} data-autofocus>
          {cancelLabel}
        </Button>
        <Button color={confirmColor} onClick={onConfirm} loading={isLoading}>
          {confirmLabel}
        </Button>
      </Group>
    </Stack>
  </Modal>
);
