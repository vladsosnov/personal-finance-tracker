import { Button, Group, Modal, Stack, Text } from "@mantine/core";
import type { Goal } from "@/features/dashboard/types";

type CompleteGoalModalProps = {
  goal: Goal | null;
  isLoading: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export const CompleteGoalModal = ({ goal, isLoading, onConfirm, onClose }: CompleteGoalModalProps) => (
  <Modal opened={Boolean(goal)} onClose={() => { if (!isLoading) onClose(); }} title="Complete goal?" centered>
    <Stack gap="md">
      <Text>
        <strong>{goal?.title ?? "This goal"}</strong> has reached its target. Do you want to move it to completed goals?
      </Text>
      <Group justify="flex-end">
        <Button variant="default" onClick={onClose} disabled={isLoading}>
          Keep active
        </Button>
        <Button color="teal" loading={isLoading} onClick={onConfirm}>
          Complete
        </Button>
      </Group>
    </Stack>
  </Modal>
);
