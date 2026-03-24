import { Button, Group, Modal, NumberInput, Stack, TextInput } from "@mantine/core";
import { GoalColorPicker } from "@/features/dashboard/components/goal-color-picker";
import { MONEY_INPUT_PROPS, numberOrZero } from "@/shared/utils/number";
import { useGoalForm } from "@/features/dashboard/hooks/useGoalForm";

type EditGoalModalProps = {
  opened: boolean;
  isLoading: boolean;
  form: ReturnType<typeof useGoalForm>;
  onConfirm: () => void;
  onClose: () => void;
};

export const EditGoalModal = ({ opened, isLoading, form, onConfirm, onClose }: EditGoalModalProps) => (
  <Modal opened={opened} onClose={() => { if (!isLoading) onClose(); }} title="Edit goal" centered>
    <Stack gap="md">
      <TextInput
        label="Title"
        value={form.title}
        maxLength={80}
        onChange={(e) => form.setTitle(e.currentTarget.value)}
      />
      <NumberInput
        label="Target amount"
        placeholder="25000"
        {...MONEY_INPUT_PROPS}
        value={form.targetAmount}
        onChange={(value) => form.setTargetAmount(numberOrZero(value))}
      />
      <NumberInput
        label="Starting amount"
        placeholder="5000"
        {...MONEY_INPUT_PROPS}
        min={0}
        value={form.initialAmount}
        onChange={(value) => form.setInitialAmount(numberOrZero(value))}
      />
      <GoalColorPicker label="Color" value={form.color} onChange={form.setColor} disabled={isLoading} />
      <Group justify="flex-end">
        <Button variant="default" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button onClick={onConfirm} loading={isLoading} disabled={!form.isValid}>
          Save
        </Button>
      </Group>
    </Stack>
  </Modal>
);
