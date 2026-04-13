import { useCallback, type ReactNode } from "react";
import { IconAlertTriangle, IconDotsVertical, IconGripVertical, IconX } from "@tabler/icons-react";
import { Button, Card, Group, ScrollArea, Skeleton, Stack, Text, Tooltip } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
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
  icon?: ReactNode;
  iconColor?: string;
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
  const isMobile = useMediaQuery("(max-width: 768px)");
  const emptyTitle = emptyState?.title ?? "No goals yet";
  const emptyDescription = emptyState?.description ?? "Create your first goal to start tracking progress.";
  const isDraggable = allowDrag && !manageMode.isActive && !isMobile;

  const handleListKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!goals.length || (e.key !== "ArrowDown" && e.key !== "ArrowUp")) return;
    e.preventDefault();
    const currentIndex = goals.findIndex((g) => g.id === selectedGoalId);
    const nextIndex = e.key === "ArrowDown"
      ? Math.min(currentIndex + 1, goals.length - 1)
      : Math.max(currentIndex - 1, 0);
    if (nextIndex !== currentIndex) onSelectGoal(goals[nextIndex].id);
  }, [goals, selectedGoalId, onSelectGoal]);

  return (
    <Card withBorder radius="md" p={isMobile ? "xs" : "lg"} data-testid="goals-list-card">
      <Stack gap={6}>
        <Group justify="space-between" align="center">
          {isLoadingGoals ? (
            <Skeleton height={24} width={240} />
          ) : isDraggable && goals.length > 0 ? (
            <Tooltip label="Drag cards to reorder" position="right" openDelay={400}>
              <Group gap={4} style={{ cursor: "default" }}>
                <IconGripVertical size={14} stroke={1.5} color="var(--mantine-color-dimmed)" />
                <Text size="xs" c="dimmed">Reorder</Text>
              </Group>
            </Tooltip>
          ) : <span />}
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
        <ScrollArea
          h={isMobile ? 360 : 520}
          offsetScrollbars={!isMobile}
          scrollbarSize={8}
          onKeyDown={handleListKeyDown}
          data-testid="goals-list-scroll-area"
        >
          <Stack gap="sm">
            {isLoadingGoals ? (
              <GoalsLoadingSkeleton />
            ) : errorMessage ? (
              <Card withBorder radius="md" p="xl">
                <StateMessage title="Couldn't load goals" description={errorMessage} actionLabel="Try again" onAction={onRetry} icon={<IconAlertTriangle size={24} />} iconColor="red" />
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
                  onTouchStart={() => { if (isDraggable) drag.handleTouchStart(goal.id); }}
                  onTouchMove={(e) => { if (isDraggable) drag.handleTouchMove(e); }}
                  onTouchEnd={() => { if (isDraggable) drag.handleTouchEnd(); }}
                />
              ))
            )}
            {!isLoadingGoals && !errorMessage && !goals.length && (
              <Card withBorder radius="md" p="xl">
                <StateMessage title={emptyTitle} description={emptyDescription} icon={emptyState?.icon} iconColor={emptyState?.iconColor} />
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
    {Array.from({ length: 3 }).map((_, i) => (
      <Card key={i} withBorder radius="md" p="sm" mb="sm">
        <Stack gap="xs">
          <Group justify="space-between">
            <Skeleton height={24} width="42%" />
            <Skeleton height={26} width={64} radius="xl" />
          </Group>
          <Skeleton height={20} width="58%" />
          <Skeleton height={16} radius="xl" />
        </Stack>
      </Card>
    ))}
  </div>
);
