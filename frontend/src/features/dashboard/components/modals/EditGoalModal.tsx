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
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (form.isValid) onConfirm();
      }}
    >
      <Stack gap="md">
        <TextInput
          label="Title"
          required
          aria-required
          value={form.title}
          maxLength={80}
          onChange={(e) => form.setTitle(e.currentTarget.value)}
        />
        <NumberInput
          label="Target amount"
          placeholder="25000"
          required
          aria-required
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
          <Button variant="default" onClick={onClose} disabled={isLoading} type="button">
            Cancel
          </Button>
          <Button type="submit" loading={isLoading} disabled={!form.isValid}>
            Save
          </Button>
        </Group>
      </Stack>
    </form>
  </Modal>
);
