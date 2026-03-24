import { Button, Group, Modal, NumberInput, Stack, TextInput } from "@mantine/core";
import type { OperationType } from "@/shared/gql/__generated__/schema-types";
import { MONEY_INPUT_PROPS, numberOrZero } from "@/shared/utils/number";

type OperationModalProps = {
  opened: boolean;
  isEditing: boolean;
  isLoading: boolean;
  isSubmitDisabled: boolean;
  operationType: OperationType;
  operationAmount: number | "";
  operationNote: string;
  operationDate: string;
  onChangeType: (value: OperationType) => void;
  onChangeAmount: (value: number | "") => void;
  onChangeNote: (value: string) => void;
  onChangeDate: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
};

export const OperationModal = ({
  opened,
  isEditing,
  isLoading,
  isSubmitDisabled,
  operationType,
  operationAmount,
  operationNote,
  operationDate,
  onChangeType,
  onChangeAmount,
  onChangeNote,
  onChangeDate,
  onSubmit,
  onClose,
}: OperationModalProps) => (
  <Modal opened={opened} onClose={onClose} title={isEditing ? "Edit" : "Add"} centered>
    <Stack gap="md">
      <Group gap="xs" wrap="nowrap">
        <Button
          fullWidth
          color="teal"
          variant={operationType === "INCREASE" ? "light" : "subtle"}
          onClick={() => onChangeType("INCREASE")}
        >
          Increase
        </Button>
        <Button
          fullWidth
          color="red"
          variant={operationType === "DECREASE" ? "light" : "subtle"}
          onClick={() => onChangeType("DECREASE")}
        >
          Decrease
        </Button>
      </Group>
      <NumberInput
        label="Amount"
        placeholder="500"
        {...MONEY_INPUT_PROPS}
        value={operationAmount}
        onChange={(value) => onChangeAmount(numberOrZero(value))}
      />
      <TextInput
        label="Date"
        type="date"
        value={operationDate}
        onChange={(e) => onChangeDate(e.currentTarget.value)}
      />
      <TextInput
        label="Note"
        placeholder="Salary transfer..."
        value={operationNote}
        onChange={(e) => onChangeNote(e.currentTarget.value)}
      />
      <Group justify="flex-end">
        <Button variant="default" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button onClick={onSubmit} loading={isLoading} disabled={isSubmitDisabled}>
          {isEditing ? "Save" : "Add"}
        </Button>
      </Group>
    </Stack>
  </Modal>
);
