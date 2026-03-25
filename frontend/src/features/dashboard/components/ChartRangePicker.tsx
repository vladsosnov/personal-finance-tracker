import { IconChevronDown } from "@tabler/icons-react";
import { Button, Popover, Stack } from "@mantine/core";

export const CHART_RANGE_OPTIONS = [
  { label: "All time", value: "all" },
  { label: "7D", value: "7d" },
  { label: "1M", value: "1m" },
  { label: "6M", value: "6m" },
  { label: "12M", value: "12m" },
] as const;

export type ChartRange = (typeof CHART_RANGE_OPTIONS)[number]["value"];

type ChartRangePickerProps = {
  value: ChartRange;
  opened: boolean;
  onToggle: () => void;
  onChange: (value: ChartRange) => void;
};

export const ChartRangePicker = ({ value, opened, onToggle, onChange }: ChartRangePickerProps) => {
  const selectedLabel = CHART_RANGE_OPTIONS.find((o) => o.value === value)?.label ?? "All time";

  return (
    <Popover opened={opened} onChange={onToggle} position="bottom-end" withArrow shadow="md">
      <Popover.Target>
        <Button
          variant="subtle"
          rightSection={<IconChevronDown size={16} stroke={2} />}
          onClick={onToggle}
          aria-label={`Chart range: ${selectedLabel}`}
          aria-expanded={opened}
          aria-haspopup="listbox"
        >
          {selectedLabel}
        </Button>
      </Popover.Target>
      <Popover.Dropdown p="xs">
        <Stack gap={4} role="listbox" aria-label="Chart time range">
          {CHART_RANGE_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={value === option.value ? "light" : "subtle"}
              justify="flex-start"
              role="option"
              aria-selected={value === option.value}
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
};
