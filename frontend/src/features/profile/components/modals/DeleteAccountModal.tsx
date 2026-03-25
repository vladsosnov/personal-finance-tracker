import { Button, Group, Modal, Stack, Text } from "@mantine/core";

type DeleteAccountModalProps = {
  opened: boolean;
  isLoading: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export const DeleteAccountModal = ({ opened, isLoading, onConfirm, onClose }: DeleteAccountModalProps) => (
  <Modal opened={opened} onClose={() => { if (!isLoading) onClose(); }} title="Delete account?" centered aria-describedby="delete-account-desc">
    <Stack gap="md">
      <Text id="delete-account-desc">This will permanently delete your account and all associated goals and operations. This action cannot be undone.</Text>
      <Group justify="flex-end">
        <Button variant="default" onClick={onClose} disabled={isLoading} data-autofocus>
          Cancel
        </Button>
        <Button color="red" onClick={onConfirm} loading={isLoading}>
          Delete account
        </Button>
      </Group>
    </Stack>
  </Modal>
);
