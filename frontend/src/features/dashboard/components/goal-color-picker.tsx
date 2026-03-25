import { ColorSwatch, Group, Select, Stack, Text } from "@mantine/core";
import { GOAL_COLOR_OPTIONS } from "@/shared/constants/goal-colors";

type GoalColorPickerProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export const GoalColorPicker = ({ label, value, onChange, disabled = false }: GoalColorPickerProps) => {
  const selectedColor = GOAL_COLOR_OPTIONS.find((option) => option.value === value) ?? GOAL_COLOR_OPTIONS[0];

  return (
    <Stack gap={6}>
      <Text size="sm" fw={500}>
        {label}
      </Text>
      <Group gap="sm" wrap="nowrap">
        <ColorSwatch color={selectedColor.value} aria-hidden="true" />
        <Select
          value={value}
          data={GOAL_COLOR_OPTIONS}
          allowDeselect={false}
          aria-label={label}
          renderOption={({ option }) => (
            <Group gap="sm" wrap="nowrap">
              <ColorSwatch color={option.value} size={18} aria-hidden="true" />
              <Text size="sm">{option.label}</Text>
            </Group>
          )}
          onChange={(nextValue) => {
            if (nextValue) {
              onChange(nextValue);
            }
          }}
          disabled={disabled}
          flex={1}
        />
      </Group>
    </Stack>
  );
};
