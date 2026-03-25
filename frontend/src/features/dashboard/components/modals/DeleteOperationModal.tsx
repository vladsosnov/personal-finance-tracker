import { Button, Modal, Stack, Text } from "@mantine/core";
import type { GoalOperation } from "@/features/dashboard/types";
import { formatMoney } from "@/shared/utils/number";

type DeleteOperationModalProps = {
  operation: GoalOperation | null;
  isLoading: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export const DeleteOperationModal = ({ operation, isLoading, onConfirm, onClose }: DeleteOperationModalProps) => (
  <Modal
    opened={Boolean(operation)}
    onClose={() => { if (!isLoading) onClose(); }}
    title="Delete Operation"
    centered
    aria-describedby="delete-operation-desc"
  >
    <Stack gap="md">
      <Text id="delete-operation-desc">
        {operation
          ? `Delete this ${operation.type.toLowerCase()} operation for ${formatMoney(operation.amount)}?`
          : "Delete this operation?"}
      </Text>
      <Stack gap="xs">
        <Button color="red" onClick={onConfirm} loading={isLoading}>
          Delete
        </Button>
        <Button variant="subtle" onClick={onClose} disabled={isLoading} data-autofocus>
          Cancel
        </Button>
      </Stack>
    </Stack>
  </Modal>
);
