import { IconMaximize } from "@tabler/icons-react";
import { Badge, Button, Checkbox, Group, Stack, Text, Title, Tooltip } from "@mantine/core";
import { ChartRangePicker, type ChartRange } from "@/features/dashboard/components/ChartRangePicker";
import type { GoalDetails } from "@/features/dashboard/types";
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
    <Group gap="xs" wrap="nowrap" align="center">
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
      <Tooltip label="Expand chart" position="left">
        <Button variant="subtle" px={10} aria-label="Expand chart" onClick={onExpandChart}>
          <IconMaximize size={16} stroke={2} />
        </Button>
      </Tooltip>
    </Group>
  </Group>
);
