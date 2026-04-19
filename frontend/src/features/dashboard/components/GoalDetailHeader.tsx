import { useMemo } from "react";
import { IconMaximize, IconTrendingUp, IconX } from "@tabler/icons-react";
import { Badge, Button, Checkbox, Group, Stack, Text, Title, Tooltip } from "@mantine/core";
import { ChartRangePicker, type ChartRange } from "@/features/dashboard/components/ChartRangePicker";
import type { GoalDetails } from "@/features/dashboard/types";
import { getProjectedDate } from "@/features/dashboard/utils/goalUtils";
import { formatDay } from "@/shared/utils/date";

type GoalDetailHeaderProps = {
  goal: GoalDetails;
  chartRange: ChartRange;
  showTrend: boolean;
  isRangePickerOpen: boolean;
  onToggleRangePicker: () => void;
  onChangeRange: (value: ChartRange) => void;
  onToggleTrend: () => void;
  onExpandChart: () => void;
  onCloseSelection?: () => void;
};

export const GoalDetailHeader = ({
  goal,
  chartRange,
  showTrend,
  isRangePickerOpen,
  onToggleRangePicker,
  onChangeRange,
  onToggleTrend,
  onExpandChart,
  onCloseSelection,
}: GoalDetailHeaderProps) => {
  const projectedDate = useMemo(
    () => getProjectedDate(goal.operations, goal.targetAmount, goal.currentAmount, goal.isCompleted),
    [goal.operations, goal.targetAmount, goal.currentAmount, goal.isCompleted],
  );

  return (
  <Stack gap="xs">
    <Group justify="space-between" align="flex-start" wrap="nowrap">
      <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
        <Title order={4} lineClamp={1}>{goal.title}</Title>
        {goal.isCompleted ? (
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
        ) : projectedDate ? (
          <Group gap={4}>
            <IconTrendingUp size={14} color="var(--mantine-color-dimmed)" />
            <Text size="sm" c="dimmed">On track for ~{projectedDate}</Text>
          </Group>
        ) : null}
      </Stack>
      <Group gap={4} wrap="nowrap">
        {onCloseSelection && (
          <Tooltip label="Back to previews" position="left">
            <Button variant="subtle" px={10} aria-label="Close goal details" onClick={onCloseSelection}>
              <IconX size={16} stroke={2} />
            </Button>
          </Tooltip>
        )}
        <Tooltip label="Expand chart" position="left">
          <Button variant="subtle" px={10} aria-label="Expand chart" onClick={onExpandChart}>
            <IconMaximize size={16} stroke={2} />
          </Button>
        </Tooltip>
      </Group>
    </Group>
    <Group gap="xs" align="center">
      {chartRange === "all" && (
        <Checkbox
          checked={showTrend}
          onChange={onToggleTrend}
          label="Trend"
          size="xs"
          styles={{ label: { paddingLeft: 4 } }}
          aria-label="Show trend line"
        />
      )}
      <ChartRangePicker
        value={chartRange}
        opened={isRangePickerOpen}
        onToggle={onToggleRangePicker}
        onChange={(value) => {
          onChangeRange(value);
          onToggleRangePicker();
        }}
      />
    </Group>
  </Stack>
  );
};
