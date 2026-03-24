import { IconMaximize } from "@tabler/icons-react";
import { Badge, Button, Group, Stack, Text, Title } from "@mantine/core";
import { ChartRangePicker, type ChartRange } from "@/features/dashboard/components/ChartRangePicker";
import type { GoalDetails } from "@/features/dashboard/types";
import { formatDay } from "@/shared/utils/date";

type GoalDetailHeaderProps = {
  goal: GoalDetails;
  chartRange: ChartRange;
  isRangePickerOpen: boolean;
  onToggleRangePicker: () => void;
  onChangeRange: (value: ChartRange) => void;
  onExpandChart: () => void;
};

export const GoalDetailHeader = ({
  goal,
  chartRange,
  isRangePickerOpen,
  onToggleRangePicker,
  onChangeRange,
  onExpandChart,
}: GoalDetailHeaderProps) => (
  <Group justify="space-between" align="flex-start">
    <Stack gap={4}>
      <Title order={4}>{goal.title}</Title>
      {goal.isCompleted && (
        <Group gap="xs">
          <Badge color="teal" variant="light">
            Completed
          </Badge>
          {goal.completedAt && (
            <Text size="sm" c="dimmed">
              {formatDay(goal.completedAt.slice(0, 10))}
            </Text>
          )}
        </Group>
      )}
    </Stack>
    <Group gap="xs" wrap="nowrap">
      <ChartRangePicker
        value={chartRange}
        opened={isRangePickerOpen}
        onToggle={onToggleRangePicker}
        onChange={(value) => {
          onChangeRange(value);
          onToggleRangePicker();
        }}
      />
      <Button variant="light" px={10} aria-label="Expand chart" onClick={onExpandChart}>
        <IconMaximize size={16} stroke={2} />
      </Button>
    </Group>
  </Group>
);
