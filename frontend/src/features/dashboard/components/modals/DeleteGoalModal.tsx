import { Button, Group, Modal, Stack, Text } from "@mantine/core";

type DeleteGoalModalProps = {
  goalTitle: string | null;
  isLoading: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export const DeleteGoalModal = ({ goalTitle, isLoading, onConfirm, onClose }: DeleteGoalModalProps) => (
  <Modal opened={Boolean(goalTitle)} onClose={() => { if (!isLoading) onClose(); }} title="Remove goal?" centered aria-describedby="delete-goal-desc">
    <Stack gap="md">
      <Text id="delete-goal-desc">
        Remove <strong>{goalTitle ?? "this goal"}</strong> and all of its operations? This action cannot be undone.
      </Text>
      <Group justify="flex-end">
        <Button variant="default" onClick={onClose} disabled={isLoading} data-autofocus>
          Cancel
        </Button>
        <Button color="red" onClick={onConfirm} loading={isLoading}>
          Remove
        </Button>
      </Group>
    </Stack>
  </Modal>
);
