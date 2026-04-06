import { useMemo } from "react";
import { ColorSwatch, Group, Select, Text } from "@mantine/core";
import { GOAL_COLOR_OPTIONS } from "@/shared/constants/goal-colors";
import { useCustomColors } from "@/features/profile/hooks/useCustomColors";

type GoalColorPickerProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export const GoalColorPicker = ({ label, value, onChange, disabled = false }: GoalColorPickerProps) => {
  const { colors: customColors } = useCustomColors();

  const allOptions = useMemo(() => {
    const preset = GOAL_COLOR_OPTIONS.map((o) => ({ value: o.value, label: o.label }));
    if (customColors.length === 0) return preset;

    const presetValues = new Set(GOAL_COLOR_OPTIONS.map((o) => o.value.toUpperCase()));
    const custom = customColors.filter((c) => !presetValues.has(c.value.toUpperCase()));

    if (custom.length === 0) return preset;
    return [
      { group: "Preset", items: preset },
      { group: "Custom", items: custom.map((c) => ({ value: c.value, label: c.label })) },
    ];
  }, [customColors]);

  const selectedColorValue =
    [...GOAL_COLOR_OPTIONS, ...customColors].find((o) => o.value === value)?.value ?? GOAL_COLOR_OPTIONS[0].value;

  return (
    <Select
      label={label}
      value={value}
      data={allOptions}
      allowDeselect={false}
      leftSection={<ColorSwatch color={selectedColorValue} size={16} />}
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
    />
  );
};
