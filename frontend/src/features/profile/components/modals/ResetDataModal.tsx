import { Button, Group, Modal, Stack, Text } from "@mantine/core";

type ResetDataModalProps = {
  opened: boolean;
  isLoading: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export const ResetDataModal = ({ opened, isLoading, onConfirm, onClose }: ResetDataModalProps) => (
  <Modal opened={opened} onClose={() => { if (!isLoading) onClose(); }} title="Reset all data?" centered aria-describedby="reset-data-desc">
    <Stack gap="md">
      <Text id="reset-data-desc">This will permanently remove all goals and operations from your account.</Text>
      <Group justify="flex-end">
        <Button variant="default" onClick={onClose} disabled={isLoading} data-autofocus>
          Cancel
        </Button>
        <Button color="red" onClick={onConfirm} loading={isLoading}>
          Reset
        </Button>
      </Group>
    </Stack>
  </Modal>
);
