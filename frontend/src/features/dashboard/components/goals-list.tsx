import { Badge, Card, Group, Progress, ScrollArea, Stack, Text, Title } from "@mantine/core";
import type { Goal } from "@/features/dashboard/types";
import { formatMoney, getProgressPercentage } from "@/shared/utils/number";

type GoalsListProps = {
  goals: Goal[];
  selectedGoalId: string | null;
  onSelectGoal: (goalId: string) => void;
  draggingGoalId: string | null;
  dragOverGoalId: string | null;
  onDragStart: (goalId: string) => void;
  onDragOver: (goalId: string) => void;
  onDrop: (goalId: string) => void;
  onDragEnd: () => void;
};

export const GoalsList = ({
  goals,
  selectedGoalId,
  onSelectGoal,
  draggingGoalId,
  dragOverGoalId,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: GoalsListProps) => {
  return (
    <Card withBorder radius="md" p="lg">
      <Stack gap="sm">
        <Title order={4}>Goal cards</Title>
        <Text size="sm" c="dimmed">
          Drag and drop cards to change their order.
        </Text>
        <ScrollArea h={500}>
          <Stack gap="sm">
            {goals.map((goal) => {
              const goalProgress = getProgressPercentage(goal.currentAmount, goal.targetAmount);
              const isDragged = draggingGoalId === goal.id;
              const isDropTarget = dragOverGoalId === goal.id && draggingGoalId !== goal.id;

              return (
                <Card
                  key={goal.id}
                  withBorder
                  radius="md"
                  p="md"
                  draggable
                  style={{
                    cursor: isDragged ? "grabbing" : "grab",
                    borderColor: isDropTarget
                      ? "var(--mantine-color-teal-6)"
                      : selectedGoalId === goal.id
                        ? "var(--mantine-color-blue-6)"
                        : undefined,
                    opacity: isDragged ? 0.55 : 1,
                  }}
                  onDragStart={() => onDragStart(goal.id)}
                  onDragOver={(event) => {
                    event.preventDefault();
                    onDragOver(goal.id);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    onDrop(goal.id);
                  }}
                  onDragEnd={onDragEnd}
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
