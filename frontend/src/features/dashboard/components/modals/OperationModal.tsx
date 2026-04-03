import { Button, Group, Modal, NumberInput, Stack, TextInput } from "@mantine/core";
import type { OperationType } from "@/shared/gql/__generated__/schema-types";
import { MONEY_INPUT_PROPS, numberOrZero } from "@/shared/utils/number";
import { getTodayDateValue } from "@/shared/utils/date";

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
  <Modal opened={opened} onClose={onClose} title={isEditing ? "Edit operation" : "Add operation"} centered>
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!isSubmitDisabled) onSubmit();
      }}
    >
      <Stack gap="md">
        <Group gap="xs" wrap="nowrap" role="group" aria-label="Operation type">
          <Button
            fullWidth
            color="teal"
            variant={operationType === "INCREASE" ? "light" : "subtle"}
            aria-pressed={operationType === "INCREASE"}
            onClick={() => onChangeType("INCREASE")}
            type="button"
          >
            Increase
          </Button>
          <Button
            fullWidth
            color="red"
            variant={operationType === "DECREASE" ? "light" : "subtle"}
            aria-pressed={operationType === "DECREASE"}
            onClick={() => onChangeType("DECREASE")}
            type="button"
          >
            Decrease
          </Button>
        </Group>
        <NumberInput
          label="Amount"
          placeholder="500"
          required
          aria-required
          {...MONEY_INPUT_PROPS}
          value={operationAmount}
          onChange={(value) => onChangeAmount(numberOrZero(value))}
        />
        <TextInput
          label="Date"
          type="date"
          required
          aria-required
          max={getTodayDateValue()}
          value={operationDate}
          onChange={(e) => onChangeDate(e.currentTarget.value)}
        />
        <TextInput
          label="Note"
          placeholder="Salary transfer..."
          maxLength={500}
          value={operationNote}
          onChange={(e) => onChangeNote(e.currentTarget.value)}
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose} disabled={isLoading} type="button">
            Cancel
          </Button>
          <Button type="submit" loading={isLoading} disabled={isSubmitDisabled}>
            {isEditing ? "Save" : "Add"}
          </Button>
        </Group>
      </Stack>
    </form>
  </Modal>
);
