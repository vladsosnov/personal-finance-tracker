import type { ReactNode } from "react";
import { Card, Stack, Text } from "@mantine/core";
import type { Goal } from "@/features/dashboard/types";
import { formatMoney } from "@/shared/utils/number";

type GoalPreviewCardProps = {
  goal: Goal;
  chart: ReactNode;
  onSelect: (goalId: string) => void;
};

export const GoalPreviewCard = ({ goal, chart, onSelect }: GoalPreviewCardProps) => (
  <Card
    withBorder
    radius="md"
    p="md"
    component="button"
    type="button"
    onClick={() => onSelect(goal.id)}
    aria-label={`Open ${goal.title} details`}
    styles={{
      root: {
        width: "100%",
        cursor: "pointer",
        textAlign: "left",
      },
    }}
  >
    <Stack gap="sm">
      <div>
        <Text fw={700} lineClamp={1}>
          {goal.title}
        </Text>
        <Text size="sm" c="dimmed">
          {formatMoney(goal.currentAmount, goal.currency)} / {formatMoney(goal.targetAmount, goal.currency)}
        </Text>
      </div>
      {chart}
    </Stack>
  </Card>
);
