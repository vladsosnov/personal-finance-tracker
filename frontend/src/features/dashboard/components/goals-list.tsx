import { Badge, Card, Group, Progress, ScrollArea, Stack, Text, Title } from "@mantine/core";
import type { Goal } from "@/features/dashboard/types";
import { formatMoney, getProgressPercentage } from "@/shared/utils/number";

type GoalsListProps = {
  goals: Goal[];
  selectedGoalId: string | null;
  onSelectGoal: (goalId: string) => void;
};

export const GoalsList = ({ goals, selectedGoalId, onSelectGoal }: GoalsListProps) => {
  return (
    <Card withBorder radius="md" p="lg">
      <Stack gap="sm">
        <Title order={4}>Goal cards</Title>
        <ScrollArea h={500}>
          <Stack gap="sm">
            {goals.map((goal) => {
              const goalProgress = getProgressPercentage(goal.currentAmount, goal.targetAmount);

              return (
                <Card
                  key={goal.id}
                  withBorder
                  radius="md"
                  p="md"
                  style={{
                    cursor: "pointer",
                    borderColor: selectedGoalId === goal.id ? "var(--mantine-color-blue-6)" : undefined,
                  }}
                  onClick={() => onSelectGoal(goal.id)}
                >
                  <Stack gap="xs">
                    <Group justify="space-between">
                      <Text fw={700}>{goal.title}</Text>
                      <Badge variant="light">{goalProgress.toFixed(1)}%</Badge>
                    </Group>
                    <Text size="sm" c="dimmed">
                      {formatMoney(goal.currentAmount)} / {formatMoney(goal.targetAmount)}
                    </Text>
                    <Progress value={Math.max(0, Math.min(goalProgress, 100))} />
                  </Stack>
                </Card>
              );
            })}
            {!goals.length && <Text c="dimmed">No goals yet. Add your first one above.</Text>}
          </Stack>
        </ScrollArea>
      </Stack>
    </Card>
  );
};
