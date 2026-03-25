import { IconDotsVertical, IconX } from "@tabler/icons-react";
import { Button, Card, Group, ScrollArea, Skeleton, Stack, Text } from "@mantine/core";
import type { Goal } from "@/features/dashboard/types";
import type { useGoalDrag } from "@/features/dashboard/hooks/useGoalDrag";
import { GoalCard } from "@/features/dashboard/components/GoalCard";
import { StateMessage } from "@/shared/components/state-message";

export type GoalManageMode = {
  isActive: boolean;
  showToggle?: boolean;
  canManage?: boolean;
  onToggle: () => void;
  onEdit: (goalId: string) => void;
  onDelete: (goalId: string) => void;
};

export type GoalEmptyState = {
  title?: string;
  description?: string;
};

type GoalsListProps = {
  goals: Goal[];
  isLoadingGoals: boolean;
  selectedGoalId: string | null;
  manageMode: GoalManageMode;
  emptyState?: GoalEmptyState;
  errorMessage?: string | null;
  allowDrag?: boolean;
  drag: ReturnType<typeof useGoalDrag>;
  onSelectGoal: (goalId: string) => void;
  onRetry?: () => void;
};

export const GoalsList = ({
  goals,
  isLoadingGoals,
  selectedGoalId,
  manageMode,
  emptyState,
  errorMessage,
  allowDrag = true,
  drag,
  onSelectGoal,
  onRetry,
}: GoalsListProps) => {
  const emptyTitle = emptyState?.title ?? "No goals yet";
  const emptyDescription = emptyState?.description ?? "Create your first goal to start tracking progress.";
  const isDraggable = allowDrag && !manageMode.isActive;

  return (
    <Card withBorder radius="md" p="lg">
      <Stack gap={6}>
        <Group justify="space-between" align="center">
          {goals.length > 0 && (
            <Text size="sm" c="dimmed" aria-hidden="true">
              Drag and drop cards to change their order.
            </Text>
          )}
          {manageMode.showToggle !== false && (manageMode.canManage ?? goals.length > 0) && (
            <Button
              variant={manageMode.isActive ? "light" : "subtle"}
              px={10}
              aria-label={manageMode.isActive ? "Exit manage mode" : "Manage goals"}
              aria-expanded={manageMode.isActive}
              onClick={manageMode.onToggle}
            >
              {manageMode.isActive ? <IconX size={16} stroke={2} /> : <IconDotsVertical size={16} stroke={2} />}
            </Button>
          )}
        </Group>
        <ScrollArea h={540} offsetScrollbars scrollbarSize={8}>
          <Stack gap="sm" pr={4}>
            {isLoadingGoals ? (
              <GoalsLoadingSkeleton />
            ) : errorMessage ? (
              <Card withBorder radius="md" p="xl">
                <StateMessage title="Couldn't load goals" description={errorMessage} actionLabel="Try again" onAction={onRetry} />
              </Card>
            ) : (
              goals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  isSelected={selectedGoalId === goal.id}
                  isDraggable={isDraggable}
                  isDragged={drag.draggingGoalId === goal.id}
                  isDropTarget={drag.dragOverGoalId === goal.id && drag.draggingGoalId !== goal.id}
                  isManageMode={manageMode.isActive}
                  onSelect={() => onSelectGoal(goal.id)}
                  onEdit={() => manageMode.onEdit(goal.id)}
                  onDelete={() => manageMode.onDelete(goal.id)}
                  onDragStart={() => { if (isDraggable) drag.handleDragStart(goal.id); }}
                  onDragOver={(e) => { if (isDraggable) { e.preventDefault(); drag.handleDragOver(goal.id); } }}
                  onDrop={(e) => { if (isDraggable) { e.preventDefault(); drag.handleDrop(goal.id); } }}
                  onDragEnd={() => { if (isDraggable) drag.handleDragEnd(); }}
                />
              ))
            )}
            {!isLoadingGoals && !errorMessage && !goals.length && (
              <Card withBorder radius="md" p="xl">
                <StateMessage title={emptyTitle} description={emptyDescription} />
              </Card>
            )}
          </Stack>
        </ScrollArea>
      </Stack>
    </Card>
  );
};


const GoalsLoadingSkeleton = () => (
  <div role="status" aria-label="Loading goals">
    <span className="sr-only">Loading goals...</span>
    {Array.from({ length: 5 }).map((_, i) => (
      <Card key={i} withBorder radius="md" p="md" mb="sm">
        <Stack gap="xs">
          <Group justify="space-between">
            <Skeleton height={20} width="42%" />
            <Skeleton height={24} width={64} radius="xl" />
          </Group>
          <Skeleton height={16} width="58%" />
          <Skeleton height={12} radius="xl" />
        </Stack>
      </Card>
    ))}
  </div>
);
